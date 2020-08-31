// This file contains FaunaDB queries
import faunadb from 'faunadb'

import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from 'unique-names-generator'

import { UserProfile } from '../types/domain-types'
import { AdminAPI } from '../types/api-types'
import { FaunaUserProfile, FaunaRef, FaunaUser } from '../types/fauna-types'

const q = faunadb.query

export function createAdminAPI(secret: string): AdminAPI {
  const client = new faunadb.Client({ secret })

  // private utils

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

  // api functions

  const getUserByEmail = async (email) => {
    const doc = await client.query<FaunaUser>(
      // Get will throw if nothing is found.
      q.Get(q.Match(q.Index('users_by_email'), email))
    )
    return { id: getIdFromRef(doc.ref), ...doc.data }
  }

  const getUserProfileById = async (id: string) => {
    const doc = await client.query<FaunaUserProfile>(
      // Get will throw if nothing is found.
      q.Get(q.Ref(q.Collection('profiles'), id))
    )
    return { id: getIdFromRef(doc.ref), ...doc.data }
  }

  const getUserTokensByEmail = async (email: string) => {
    const page = await client.paginate(
      q.Match(q.Index('tokens_issued_by_email'), email)
    )
    const tokens: string[] = []
    page.each(async (page: any[]) => {
      for (const tokenIssuedRef of page) {
        const issued: any = await client.query(q.Get(tokenIssuedRef))
        tokens.push(issued.data.token)
      }
    })
    console.log('getUserTokensByEmail', tokens)
    return tokens
  }

  const loginUser = async (
    email: string
  ): Promise<{ ref: FaunaRef; secret: string }> => {
    const user = await getUserByEmail(email)
    // issue a token
    // save token in issued_tokens
    const token = await client.query<any>(
      q.Create(q.Tokens(), {
        instance: q.Ref(q.Collection('users'), user.id),
      })
    )

    // Save the token in tokens_issued collection so that it can be
    // removed later.
    await client.query(
      q.Create(q.Collection('tokens_issued'), {
        data: {
          email,
          token: token.ref,
        },
      })
    )

    return { ref: token.ref, secret: token.secret }
  }

  const logoutUser = async (email: string): Promise<void> => {
    // TODO: do this in one query with q.Lambda()
    const tokensIssued = await client.paginate(
      q.Match(q.Index('tokens_issued_by_email'), email)
    )
    await tokensIssued.each(async (page: any[]) => {
      for (const tokenIssuedRef of page) {
        // delete each token
        const issued: any = await client.query(q.Get(tokenIssuedRef))
        await client.query(q.Delete(issued.data.token))
        await client.query(q.Delete(tokenIssuedRef))
      }
    })
  }

  const profileExists = async (userName: string) => {
    const exists = await client.query<boolean>(
      q.Exists(q.Match(q.Index('profiles_by_username'), userName))
    )
    // console.log(`${userName} exists?`, exists)
    return exists
  }

  const createUserAndProfile = async (email) => {
    const newUser: FaunaUser = { data: { email } }
    let user = await client.query<FaunaUser>(
      q.Create(q.Collection('users'), newUser)
    )
    // console.log('created user:', JSON.stringify(user, undefined, 2))

    // Also generate a unique public profile for the new user.
    const name = generateUserProfileName()
    let hashCode = generateUserProfileHashCode()
    while (await profileExists(makeUsername(name, hashCode))) {
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

    let profile = await client.query<FaunaUserProfile>(
      q.Create(q.Collection('profiles'), newProfile)
    )

    // console.log(
    //   'created user profile:',
    //   JSON.stringify(profile, undefined, 2)
    // )

    // update fauna user to keep track of profile
    await client.query(
      q.Update(user.ref, {
        data: { profileId: profile.ref.value.id },
      })
    )

    return {
      user: { id: getIdFromRef(user.ref), ...user.data },
      profile: { id: getIdFromRef(profile.ref), ...profile.data },
    }
  }

  async function updateUserProfileName(
    profileId: string,
    newName: string
  ): Promise<UserProfile> {
    // TODO: rbac policy: only user can modify own profile

    // find unique username using new name by changing hashcode
    const profile = await getUserProfileById(profileId)
    let hashCode = profile.hashCode
    let newUserName = makeUsername(newName, hashCode)
    while (await profileExists(newUserName)) {
      hashCode = generateUserProfileHashCode()
      newUserName = makeUsername(newName, hashCode)
    }

    // update profile (name and username) and return new profile
    await client.query<FaunaUserProfile>(
      q.Update(q.Ref(q.Collection('profiles'), profile.id), {
        data: {
          name: newName,
          hashCode,
          userName: newUserName,
        },
      })
    )

    return await getUserProfileById(profile.id)
  }

  return {
    getUserByEmail,
    getUserProfileById,
    getUserTokensByEmail,
    loginUser,
    logoutUser,
    profileExists,
    createUserAndProfile,
    updateUserProfileName,
  }
}
