import faunadb from 'faunadb'

import {
  UserProfile,
  Occasion,
  SignupRequest,
  Invitation,
  Gift,
  Claim,
  Participant,
} from '../types/domain-types'
import { IUserAPI } from '../types/api-types'
import {
  FaunaUserProfile,
  FaunaRef,
  FaunaUser,
  FaunaOccasion,
  FaunaSignupRequest,
  FaunaInvitation,
  FaunaGift,
  FaunaClaim,
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

  async getUserByEmail(email) {
    const doc = await this.client.query<FaunaUser>(
      // Get will throw if nothing is found.
      q.Get(q.Match(q.Index('users_by_email'), email))
    )
    return unwrapWithId(doc)
  }

  async getUserProfileById(id: string): Promise<UserProfile> {
    const doc = await this.client.query<FaunaUserProfile>(
      q.Get(q.Ref(q.Collection('profiles'), id))
    )
    return unwrapWithId(doc)
  }

  async getUserProfileByUserName(userName: string): Promise<UserProfile> {
    const doc = await this.client.query<FaunaUserProfile>(
      q.Get(q.Match(q.Index('profiles_by_username'), userName))
    )
    return unwrapWithId(doc)
  }

  // OCCASIONS

  async createOccasion(params: {
    title: string
    description?: string
    allowSignups?: boolean
  }): Promise<Occasion> {
    // TODO: how to do this in one query?
    const { title, description = '', allowSignups = false } = params
    const organizer: string = await this.client.query(getIdentityProfileId())
    const occasion: Occasion = { title, description, allowSignups, organizer }
    const doc = await this.client.query<FaunaOccasion>(
      q.Create(q.Collection('occasions'), {
        data: occasion,
      })
    )
    return unwrapWithId(doc)
  }
  async deleteOccasion(occasionId: string): Promise<void> {
    const deleteAllById = (index, id) =>
      q.Foreach(q.Paginate(q.Match(q.Index(index), id)), (ref) => q.Delete(ref))
    await this.client.query(
      q.Do(
        deleteAllById('invitations_by_occasionId', occasionId),
        deleteAllById('signuprequests_by_occasionId', occasionId),
        deleteAllById('claims_by_occasionId', occasionId),
        deleteAllById('gifts_by_occasionId', occasionId),
        deleteAllById('participants_by_occasionId', occasionId),
        q.Delete(q.Ref(q.Collection('occasions'), occasionId))
      )
    )
  }

  async getOccasionById(id: string): Promise<Occasion> {
    const doc = await this.client.query<FaunaOccasion>(
      q.Get(q.Ref(q.Collection('occasions'), id))
    )
    return unwrapWithId(doc)
  }

  async getOccasionsByOrganizer(profileId: string): Promise<Occasion[]> {
    const pageHelper = this.client
      .paginate(q.Match(q.Index('occasions_by_organizer'), profileId))
      .map((ref) => q.Get(ref))
    return unwrapPages(pageHelper)
  }

  async getOccasionsByParticipant(profileId: string): Promise<Occasion[]> {
    const pageHelper = this.client
      .paginate(
        q.Match(q.Index('participants_occasionId_by_profileId'), profileId)
      )
      .map((id) => q.Get(q.Ref(q.Collection('occasions'), id)))
    return unwrapPages(pageHelper)
  }

  async updateOccasion(occasion: Occasion): Promise<Occasion> {
    const doc = await this.client.query<FaunaOccasion>(
      q.Update(q.Ref(q.Collection('occasions'), occasion.id), {
        data: stripDataId(occasion),
      })
    )
    return unwrapWithId(doc)
  }

  async createSignupRequest(occasionId: string): Promise<SignupRequest> {
    const profileId: string = await this.client.query(getIdentityProfileId())
    const doc = await this.client.query<FaunaSignupRequest>(
      q.Create(q.Collection('signuprequests'), {
        data: {
          occasionId,
          profileId,
        },
      })
    )
    return unwrapWithId(doc)
  }
  async getSentSignupRequests(): Promise<SignupRequest[]> {
    const pageHelper = this.client
      .paginate(
        q.Match(q.Index('signuprequests_by_profileId'), getIdentityProfileId())
      )
      .map((ref) => q.Get(ref))
    return unwrapPages(pageHelper)
  }
  async getReceivedSignupRequests(): Promise<SignupRequest[]> {
    // Get all signuprequests for occasions where the current user is the occasion organizer
    const pageHelper = this.client
      .paginate(
        q.Join(
          // source set (index values to be used as terms of another index)
          q.Match(q.Index('occasions_by_organizer'), getIdentityProfileId()),
          // use items of source set to read from another index
          q.Lambda(
            'ref',
            q.Match(
              q.Index('signuprequests_by_occasionId'),
              q.Select(['id'], q.Var('ref'))
            )
          )
        )
      )
      .map((ref) => q.Get(ref))
    return unwrapPages(pageHelper)
  }
  async deleteSignupRequest(signupRequestId: string): Promise<void> {
    await this.client.query(
      q.Delete(q.Ref(q.Collection('signuprequests'), signupRequestId))
    )
  }

  async createInvitation(
    occasionId: string,
    recipient: string
  ): Promise<Invitation> {
    const sender: string = await this.client.query(getIdentityProfileId())
    const doc = await this.client.query<FaunaInvitation>(
      q.Create(q.Collection('invitations'), {
        data: {
          occasionId,
          sender,
          recipient,
          status: 'pending',
        },
      })
    )
    return unwrapWithId(doc)
  }
  async getSentInvitations(): Promise<Invitation[]> {
    const pageHelper = this.client
      .paginate(
        q.Match(q.Index('invitations_by_sender'), getIdentityProfileId())
      )
      .map((ref) => q.Get(ref))
    return unwrapPages(pageHelper)
  }
  async getReceivedInvitations(): Promise<Invitation[]> {
    const pageHelper = this.client
      .paginate(
        q.Match(q.Index('invitations_by_recipient'), getIdentityProfileId())
      )
      .map((ref) => q.Get(ref))
    return unwrapPages(pageHelper)
  }
  async deleteInvitation(invitationId: string): Promise<void> {
    await this.client.query(
      q.Delete(q.Ref(q.Collection('invitations'), invitationId))
    )
  }

  async getParticipantsForOccasion(occasionId: string): Promise<Participant[]> {
    const pageHelper = this.client
      .paginate(q.Match(q.Index('participants_by_occasionId'), occasionId))
      .map((ref) => q.Get(ref))
    return unwrapPages(pageHelper)
  }

  async getUserProfilesForOccasion(occasionId: string): Promise<UserProfile[]> {
    const pageHelper = this.client
      .paginate(
        q.Match(q.Index('participants_profileId_by_occasionId'), occasionId)
      )
      .map((id) => q.Get(q.Ref(q.Collection('profiles'), id)))
    return unwrapPages(pageHelper)
  }

  async createGift(params: {
    occasionId: string
    name: string
    description?: string
    imageUrl?: string
    shopUrl?: string
    suggestedFor: string
  }): Promise<Gift> {
    const {
      occasionId,
      name,
      description,
      imageUrl,
      shopUrl,
      suggestedFor,
    } = params
    const suggestedBy: string = await this.client.query(getIdentityProfileId())
    const doc = await this.client.query<FaunaGift>(
      q.Create(q.Collection('gifts'), {
        data: {
          occasionId,
          name,
          description,
          imageUrl,
          shopUrl,
          suggestedBy,
          suggestedFor,
        },
      })
    )
    return unwrapWithId(doc)
  }
  async getGiftsForOccasion(occasionId: string): Promise<Gift[]> {
    const pageHelper = this.client
      .paginate(q.Match(q.Index('gifts_by_occasionId'), occasionId))
      // exlude gifts for which current user is the recipient and not the suggester
      .filter((ref) =>
        q.Not(
          q.And(
            q.Equals(
              q.Select(
                ['data', 0],
                q.Paginate(q.Match(q.Index('gift_suggestedFor'), ref))
              ),
              getIdentityProfileId()
            ),
            q.Not(
              q.Equals(
                q.Select(
                  ['data', 0],
                  q.Paginate(q.Match(q.Index('gift_suggestedBy'), ref))
                ),
                getIdentityProfileId()
              )
            )
          )
        )
      )
      .map((ref) => q.Get(ref))
    return unwrapPages(pageHelper)
  }
  async deleteGift(giftId: string): Promise<void> {
    await this.client.query(
      q.Do(
        // when deleting a gift, also delete all claims on that gift
        q.Foreach(
          q.Paginate(q.Match(q.Index('claims_by_giftId'), giftId)),
          (ref) => q.Delete(ref)
        ),
        q.Delete(q.Ref(q.Collection('gifts'), giftId))
      )
    )
  }

  // CLAIMS
  async claimGift(params: {
    giftId: string
    anonymous?: boolean
  }): Promise<Claim> {
    const getGiftOccasionId = (giftId) =>
      q.Select(
        ['data', 0],
        q.Paginate(
          q.Match(
            q.Index('gift_occasionId'),
            q.Ref(q.Collection('gifts'), giftId)
          )
        )
      )
    const { giftId, anonymous } = params
    // const claimedBy: string = await this.client.query(getIdentityProfileId())
    const doc = await this.client.query<FaunaClaim>(
      q.Let(
        {
          params: {
            data: {
              giftId,
              anonymous,
              claimedBy: getIdentityProfileId(),
              occasionId: getGiftOccasionId(giftId),
            },
          },
        },
        q.Create(q.Collection('claims'), q.Var('params'))
      )
    )
    return unwrapWithId(doc)
  }
  async getClaimsForOccasion(occasionId: string): Promise<Claim[]> {
    const getClaimGiftRef = (claimRef) =>
      q.Ref(
        q.Collection('gifts'),
        q.Select(
          ['data', 0],
          q.Paginate(q.Match(q.Index('claim_giftId'), claimRef))
        )
      )
    const pageHelper = this.client
      .paginate(q.Match(q.Index('claims_by_occasionId'), occasionId))
      // take only claims for which current user is not the gift recipient
      .filter((ref) =>
        q.Not(
          q.Equals(
            q.Select(
              ['data', 0],
              q.Paginate(
                q.Match(q.Index('gift_suggestedFor'), getClaimGiftRef(ref))
              )
            ),
            getIdentityProfileId()
          )
        )
      )
      .map((ref) => q.Get(ref))
    const claims: Claim[] = await unwrapPages(pageHelper)
    // unset the claimedBy fields of anonymous claims. TODO: make this happen at
    // the database level - we've already transmitted the data we are trying to
    // hide, so users can still get the claimedBy values from the network
    // request if they are interested.
    for (const claim of claims) {
      if (claim.anonymous) {
        delete claim.claimedBy
      }
    }
    return claims
  }
  async deleteClaim(claimId: string): Promise<void> {
    await this.client.query(q.Delete(q.Ref(q.Collection('claims'), claimId)))
  }
}

export function createFaunaUserAPI(secret: string): IUserAPI {
  return new FaunaUserAPI(secret)
}
