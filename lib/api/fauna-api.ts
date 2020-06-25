// This file contains FaunaDB queries
import faunadb from 'faunadb'

import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from 'unique-names-generator'

import { UserProfile, User } from '../domain-types'
import { UserAPI, AdminAPI } from './api-types'
import { FaunaUserProfile, FaunaRef, FaunaUser } from './fauna-types'

const q = faunadb.query

export function createUserAPI(secret: string): UserAPI {
  const client = new faunadb.Client({ secret })

  const getUserProfileByUserName = async (
    userName: string
  ): Promise<UserProfile> => {
    const doc = await client.query<FaunaUserProfile>(
      q.Get(q.Match(q.Index('profiles_by_username'), userName))
    )
    return { id: doc.ref.value.id, ...doc.data }
  }

  const getUserProfileById = async (id: string): Promise<UserProfile> => {
    const doc = await client.query<FaunaUserProfile>(
      q.Get(q.Ref(q.Collection('profiles'), id))
    )
    return { id: doc.ref.value.id, ...doc.data }
  }

  return {
    getUserProfileByUserName,
    getUserProfileById,
  }
}

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

  const getProfileById = async (id: string) => {
    const doc = await client.query<FaunaUserProfile>(
      // Get will throw if nothing is found.
      q.Get(q.Ref(q.Collection('profiles'), id))
    )
    return { id: getIdFromRef(doc.ref), ...doc.data }
  }

  const profileExists = async (userName: string) => {
    return await client.query<boolean>(
      // Get will throw if nothing is found.
      q.Exists(q.Match(q.Index('profiles_by_username'), userName))
    )
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
    userToken: string,
    name: string
  ): Promise<UserProfile> {
    // TODO:
    // security check: verify that user token belongs to the given profileId

    // find unique username using new name by changing hashcode
    // update profile (name and username) and return new profile
    throw new Error('Not implemented')
    return null
  }

  return {
    getUserByEmail,
    getProfileById,
    profileExists,
    createUserAndProfile,
    updateUserProfileName,
  }
}
