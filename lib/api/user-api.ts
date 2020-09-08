import faunadb from 'faunadb'

import { UserProfile, Occasion } from '../types/domain-types'
import { IUserAPI } from '../types/api-types'
import {
  FaunaUserProfile,
  FaunaRef,
  FaunaUser,
  FaunaOccasion,
} from '../types/fauna-types'
import { getIdentityProfileId } from './util'

const q = faunadb.query
const getIdFromRef = (ref: FaunaRef) => ref.value.id

/**
 * Pick the data from a Fauna document and insert the id portion of the document
 * ref.
 * @param doc Fauna document containing a domain object
 * @returns Domain object with id populated from document ref.
 */
const unwrapWithId = <T>(doc: { ref?: FaunaRef; data: T }): T => {
  return { id: getIdFromRef(doc.ref), ...doc.data }
}

/**
 * Use before updating a document, to avoid writing the document ID to the document data.
 * @param data
 */
const stripDataId = <T>(data: { id?: string } & T) => {
  const { id, ...otherData } = data
  return otherData
}

/**
 * Iterate through all given pages, treating each item as a domain document,
 * unwrapping each document as a domain object and returning the list of domain
 * objects.
 * @param page
 */
async function unwrapPages<T>(page: faunadb.PageHelper) {
  const results: T[] = []
  await page.each(async (page: any[]) => {
    for (const doc of page) {
      results.push(unwrapWithId(doc))
    }
  })
  return results
}

export class FaunaUserAPI implements IUserAPI {
  client: faunadb.Client
  constructor(secret: string) {
    this.client = new faunadb.Client({ secret })
  }

  getUserByEmail = async (email) => {
    const doc = await this.client.query<FaunaUser>(
      // Get will throw if nothing is found.
      q.Get(q.Match(q.Index('users_by_email'), email))
    )
    return unwrapWithId(doc)
  }

  getUserProfileById = async (id: string): Promise<UserProfile> => {
    const doc = await this.client.query<FaunaUserProfile>(
      q.Get(q.Ref(q.Collection('profiles'), id))
    )
    return unwrapWithId(doc)
  }

  getUserProfileByUserName = async (userName: string): Promise<UserProfile> => {
    const doc = await this.client.query<FaunaUserProfile>(
      q.Get(q.Match(q.Index('profiles_by_username'), userName))
    )
    return unwrapWithId(doc)
  }

  // OCCASIONS

  createOccasion = async (params: {
    title: string
    description?: string
    allowSignups?: boolean
  }): Promise<Occasion> => {
    // TODO: how to do this in one query?
    const { title, description, allowSignups } = params
    const organizer: string = await this.client.query(getIdentityProfileId())
    const occasion: Occasion = { title, description, allowSignups, organizer }
    const doc = await this.client.query<FaunaOccasion>(
      q.Create(q.Collection('occasions'), {
        data: occasion,
      })
    )
    return unwrapWithId(doc)
  }

  deleteOccasion = async (occasionId: string): Promise<void> => {
    await this.client.query(
      q.Do(
        q.Delete(q.Ref(q.Collection('occasions'), occasionId))
        // TODO: delete all other documents related to this occasion:
        //  - invitations
        //  - signup requests
        //  - claims
        //  - gifts
        //  - participants
      )
    )
  }

  getOccasionById = async (id: string): Promise<Occasion> => {
    const doc = await this.client.query<FaunaOccasion>(
      q.Get(
        q.Match(q.Index('all_occasions'), q.Ref(q.Collection('occasions'), id))
      )
    )
    return unwrapWithId(doc)
  }

  getOccasionsByOrganizer = async (profileId: string): Promise<Occasion[]> => {
    const pageHelper = this.client
      .paginate(q.Match(q.Index('occasions_by_organizer'), profileId))
      .map((ref) => q.Get(ref))
    return unwrapPages(pageHelper)
  }

  updateOccasion = async (occasion: Occasion): Promise<Occasion> => {
    const doc = await this.client.query<FaunaOccasion>(
      q.Update(q.Ref(q.Collection('occasions'), occasion.id), {
        data: stripDataId(occasion),
      })
    )
    return unwrapWithId(doc)
  }
}

export function createFaunaUserAPI(secret: string): IUserAPI {
  return new FaunaUserAPI(secret)
}
