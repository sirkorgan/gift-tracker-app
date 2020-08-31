import faunadb from 'faunadb'

import { UserProfile } from '../types/domain-types'
import { UserAPI } from '../types/api-types'
import { FaunaUserProfile, FaunaRef, FaunaUser } from '../types/fauna-types'

const q = faunadb.query

export function createUserAPI(secret: string): UserAPI {
  const client = new faunadb.Client({ secret })

  const getIdFromRef = (ref: FaunaRef) => ref.value.id

  /**
   * This should only return for a user when the user uses their own email address.
   * @param email
   */
  const getUserByEmail = async (email) => {
    try {
      const doc = await client.query<FaunaUser>(
        // Get will throw if nothing is found.
        q.Get(q.Match(q.Index('users_by_email'), email))
      )
      return { id: getIdFromRef(doc.ref), ...doc.data }
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const getUserProfileById = async (id: string): Promise<UserProfile> => {
    try {
      const doc = await client.query<FaunaUserProfile>(
        q.Get(q.Ref(q.Collection('profiles'), id))
      )
      return { id: doc.ref.value.id, ...doc.data }
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const getUserProfileByUserName = async (
    userName: string
  ): Promise<UserProfile> => {
    try {
      const doc = await client.query<FaunaUserProfile>(
        q.Get(q.Match(q.Index('profiles_by_username'), userName))
      )
      return { id: doc.ref.value.id, ...doc.data }
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  return {
    getUserByEmail,
    getUserProfileById,
    getUserProfileByUserName,
  }
}
