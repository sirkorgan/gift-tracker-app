// This file contains FaunaDB queries
import faunadb from 'faunadb'

import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from 'unique-names-generator'

import { UserProfile, Participant } from '../types/domain-types'
import { IAdminAPI } from '../types/api-types'
import {
  FaunaUserProfile,
  FaunaRef,
  FaunaUser,
  FaunaParticipant,
} from '../types/fauna-types'
import { createFaunaUserAPI } from './user-api'

const q = faunadb.query

const generateUserProfileName = () => {
  const randomName: string = uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    length: 2,
    separator: '',
    style: 'capital',
  })
  return randomName
}

const generateUserProfileHashCode = () =>
  Math.floor(1000 + Math.random() * 9000)

const makeUsername = (name, hashcode) => name + '#' + hashcode

const getIdFromRef = (ref: FaunaRef) => ref.value.id

/**
 * Pick the data from a Fauna document and insert the id portion of the document
 * ref.
 * @param doc Fauna document containing a domain object
 * @returns Domain object with id populated from document ref.
 */
function unwrapWithId<T>(doc: { ref?: FaunaRef; data: T }): T {
  return { id: getIdFromRef(doc.ref), ...doc.data }
}

/**
 * Use before updating a document, to avoid writing the document ID to the document data.
 * @param data
 */
function stripDataId<T>(data: { id?: string } & T) {
  const { id, ...otherData } = data
  return otherData
}

class AdminAPI implements IAdminAPI {
  client: faunadb.Client
  constructor(secret: string) {
    this.client = new faunadb.Client({ secret })
  }

  async getUserByEmail(email) {
    const doc = await this.client.query<FaunaUser>(
      // Get will throw if nothing is found.
      q.Get(q.Match(q.Index('users_by_email'), email))
    )
    return unwrapWithId(doc)
  }

  async getUserProfileById(id: string) {
    const doc = await this.client.query<FaunaUserProfile>(
      // Get will throw if nothing is found.
      q.Get(q.Ref(q.Collection('profiles'), id))
    )
    return unwrapWithId(doc)
  }

  async getUserTokensByEmail(email: string) {
    const page = await this.client.paginate(
      q.Match(q.Index('tokens_issued_by_email'), email)
    )
    const tokens: string[] = []
    await page.each(async (page: any[]) => {
      for (const tokenIssuedRef of page) {
        const issued: any = await this.client.query(q.Get(tokenIssuedRef))
        tokens.push(issued.data.token)
      }
    })
    console.log('getUserTokensByEmail', tokens)
    return tokens
  }

  async verifySecret(email: string, secret: string): Promise<boolean> {
    // verify that the given secret is valid for the account with the given email
    const api = createFaunaAdminAPI(secret)
    try {
      api.getUserByEmail(email)
    } catch (err) {
      // this will throw if:
      //  - there is no user
      //  - the secret is not for the given user
      return false
    }
    return true
  }

  async loginUser(email: string): Promise<{ ref: FaunaRef; secret: string }> {
    const user = await this.getUserByEmail(email)
    // issue a token
    // save token in issued_tokens
    const token = await this.client.query<any>(
      q.Create(q.Tokens(), {
        instance: q.Ref(q.Collection('users'), user.id),
      })
    )

    // Save the token in tokens_issued collection so that it can be
    // removed later.
    await this.client.query(
      q.Create(q.Collection('tokens_issued'), {
        data: {
          email,
          token: token.ref,
        },
      })
    )

    return { ref: token.ref, secret: token.secret }
  }

  async logoutUser(email: string): Promise<void> {
    // TODO: do this in one query with q.Lambda()
    const tokensIssued = await this.client.paginate(
      q.Match(q.Index('tokens_issued_by_email'), email)
    )
    await tokensIssued.each(async (page: any[]) => {
      for (const tokenIssuedRef of page) {
        // delete each token
        const issued: any = await this.client.query(q.Get(tokenIssuedRef))
        await this.client.query(q.Delete(issued.data.token))
        await this.client.query(q.Delete(tokenIssuedRef))
      }
    })
  }

  async profileExists(userName: string) {
    const exists = await this.client.query<boolean>(
      q.Exists(q.Match(q.Index('profiles_by_username'), userName))
    )
    return exists
  }

  async userExists(email: string) {
    const exists = await this.client.query<boolean>(
      q.Exists(q.Match(q.Index('users_by_email'), email))
    )
    return exists
  }

  async createUserAndProfile(email) {
    const newUser: FaunaUser = { data: { email } }
    let user = await this.client.query<FaunaUser>(
      q.Create(q.Collection('users'), newUser)
    )
    // console.log('created user:', JSON.stringify(user, undefined, 2))

    // Also generate a unique public profile for the new user.
    const name = generateUserProfileName()
    let hashCode = generateUserProfileHashCode()
    while (await this.profileExists(makeUsername(name, hashCode))) {
      hashCode = generateUserProfileHashCode()
    }

    let userName = makeUsername(name, hashCode)

    // console.log('user.ref value', user.ref.value)

    const newProfile: FaunaUserProfile = {
      data: {
        userId: getIdFromRef(user.ref),
        name,
        hashCode,
        userName,
      },
    }

    let profile = await this.client.query<FaunaUserProfile>(
      q.Create(q.Collection('profiles'), newProfile)
    )

    // console.log(
    //   'created user profile:',
    //   JSON.stringify(profile, undefined, 2)
    // )

    // update fauna user to keep track of profile
    await this.client.query(
      q.Update(user.ref, {
        data: { profileId: profile.ref.value.id },
      })
    )

    return {
      user: unwrapWithId(user),
      profile: unwrapWithId(profile),
    }
  }

  async updateUserProfileName(
    profileId: string,
    newName: string
  ): Promise<UserProfile> {
    // TODO: rbac policy: only user can modify own profile

    // find unique username using new name by changing hashcode
    const profile = await this.getUserProfileById(profileId)
    let hashCode = profile.hashCode
    let newUserName = makeUsername(newName, hashCode)
    while (await this.profileExists(newUserName)) {
      hashCode = generateUserProfileHashCode()
      newUserName = makeUsername(newName, hashCode)
    }

    // update profile (name and username) and return new profile
    await this.client.query<FaunaUserProfile>(
      q.Update(q.Ref(q.Collection('profiles'), profile.id), {
        data: {
          name: newName,
          hashCode,
          userName: newUserName,
        },
      })
    )

    return await this.getUserProfileById(profile.id)
  }

  async addParticipant(
    profileId: string,
    occasionId: string
  ): Promise<Participant> {
    try {
      const doc = await this.client.query<FaunaParticipant>(
        q.Create(q.Collection('participants'), {
          data: {
            profileId,
            occasionId,
          },
        })
      )
      // TODO: delete any related signuprequest or invitation
      return unwrapWithId(doc)
    } catch (err) {
      console.error(err)
      throw err
    }
  }
}

export function createFaunaAdminAPI(secret: string): IAdminAPI {
  return new AdminAPI(secret)
}
