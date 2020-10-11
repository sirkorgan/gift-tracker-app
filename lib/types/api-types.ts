import {
  UserProfile,
  User,
  Occasion,
  Participant,
  SignupRequest,
  Invitation,
  Gift,
  Claim,
} from './domain-types'

export interface IUserAPI {
  getUserByEmail(email: string): Promise<User>
  getUserProfileByUserName(userName: string): Promise<UserProfile>
  getUserProfileById(id: string): Promise<UserProfile>

  // OCCASIONS

  /**
   * Current user will become the organizer of the new occasion.
   */
  createOccasion(params: {
    // TODO: add date field
    title: string
    description?: string
    allowSignups?: boolean
  }): Promise<Occasion>
  /**
   * Only organizer can delete an occasion. All associated documents will also
   * be deleted.
   */
  deleteOccasion(occasionId: string): Promise<void>
  /**
   * Only return occasion if the current user is orgnaizing or particpating.
   */
  getOccasionById(id: string): Promise<Occasion>
  /**
   *  Only return occasions if the organizer is the current user.
   */
  getOccasionsByOrganizer(profileId: string): Promise<Occasion[]>
  updateOccasion(occasion: Occasion): Promise<Occasion>

  // SIGNUP

  createSignupRequest(occasionId: string): Promise<SignupRequest>
  /**
   * Return all requests sent by the logged in user.
   */
  getSentSignupRequests(): Promise<SignupRequest[]>
  /**
   * Return all signup requests for all occasions for which the logged in user
   * is the organizer.
   */
  getReceivedSignupRequests(): Promise<SignupRequest[]>
  deleteSignupRequest(signupRequestId: string): Promise<void>

  // INVITATION

  createInvitation(occasionId: string, profileId: string): Promise<Invitation>
  getSentInvitations(): Promise<Invitation[]>
  getReceivedInvitations(): Promise<Invitation[]>
  deleteInvitation(invitationId: string): Promise<void>

  // PARTICIPANTS
  // getParticipantsByOccasion

  // GIFTS
  createGift(params: {
    occasionId: string
    name: string
    description?: string
    imageUrl?: string
    shopUrl?: string
    suggestedFor: string
  }): Promise<Gift>
  /**
   * Returns all gifts which have been suggested for the occasion. Will not
   * return gifts for which the current user is the recipient and not the
   * suggester.
   * @param occasionId
   */
  getGiftsForOccasion(occasionId: string): Promise<Gift[]>
  deleteGift(giftId: string): Promise<void>

  // CLAIMS
  claimGift(params: { giftId: string; anonymous?: boolean }): Promise<Claim>
  getClaimsForOccasion(occasionId: string): Promise<Claim[]>
  deleteClaim(claimId: string): Promise<void>
}

export interface IAdminAPI {
  getUserByEmail(email: string): Promise<User>
  getUserProfileById(profileId: string): Promise<UserProfile>
  /**
   * Returns array of token Refs issued for the user with the given email
   * address.
   * @param email
   */
  getUserTokensByEmail(email: string): Promise<string[]>
  /**
   * Returns true if the given secret is valid for the user with the given email
   * address.
   */
  verifySecret(email: string, secret: string): Promise<boolean>
  /**
   * Logs in the user with the given email address.
   *  - Creates a new token and returns the secret. Can be used to
   *    programmatically perform actions as that user.
   */
  loginUser(email: string): Promise<{ secret: string }>
  /**
   * Logs out the user with the given email address.
   *  - Removes all tokens issued to that user.
   */
  logoutUser(email: string): Promise<void>
  userExists(email: string): Promise<boolean>
  profileExists(userName: string): Promise<boolean>
  createUserAndProfile(
    email: string
  ): Promise<{ user: User; profile: UserProfile }>
  /**
   * Update the name of the current user, recalculating hashcode if necessary
   * and compute a new username.
   */
  updateUserProfileName(profileId: string, name: string): Promise<UserProfile>

  // PARTICIPANTS

  /**
   * After adding the particpant, any related SignupRequest or Invitation should
   * be deleted.
   */
  addParticipant(
    participantProfileId: string,
    occasionId: string
  ): Promise<Participant>
}

export type ChangeNameRequestBody = {
  email: string
  secret: string
  name: string
}

export type InvitationRequestBody = {
  email: string
  secret: string
  invitationId: string
  action: 'accept'
}

export type SignupRequestBody = {
  email: string
  secret: string
  signupRequestId: string
  action: 'accept' | 'reject'
}
