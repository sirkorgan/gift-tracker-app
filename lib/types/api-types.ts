import { UserProfile, User, Occasion, Participant } from './domain-types'

export interface IUserAPI {
  getUserByEmail: (email: string) => Promise<User>
  getUserProfileByUserName: (userName: string) => Promise<UserProfile>
  getUserProfileById: (id: string) => Promise<UserProfile>

  // PARTICIPANTS

  // OCCASIONS

  /**
   * Current user will become the organizer of the new occasion.
   */
  createOccasion: (params: {
    title: string
    description?: string
    allowSignups?: boolean
  }) => Promise<Occasion>
  /**
   * Only organizer can delete an occasion. All associated documents will also
   * be deleted.
   */
  deleteOccasion: (occasionId: string) => Promise<void>
  /**
   * Only return occasion if the current user is orgnaizing or particpating.
   */
  getOccasionById: (id: string) => Promise<Occasion>
  /**
   *  Only return occasions if the organizer is the current user.
   */
  getOccasionsByOrganizer: (profileId: string) => Promise<Occasion[]>
  /**
   * Allow only organizer to change:
   *  - title
   *  - description
   *  - allowSignups
   */
  updateOccasion: (occasion: Occasion) => Promise<Occasion>
}

export interface IAdminAPI {
  getUserByEmail: (email: string) => Promise<User>
  getUserProfileById: (profileId: string) => Promise<UserProfile>
  /**
   * Returns array of token Refs issued for the user with the given email
   * address.
   * @param email
   */
  getUserTokensByEmail: (email: string) => Promise<string[]>
  /**
   * Returns true if the given secret is valid for the user with the given email
   * address.
   */
  verifySecret: (email: string, secret: string) => Promise<boolean>
  /**
   * Logs in the user with the given email address.
   *  - Creates a new token and returns the secret. Can be used to
   *    programmatically perform actions as that user.
   */
  loginUser: (email: string) => Promise<{ secret: string }>
  /**
   * Logs out the user with the given email address.
   *  - Removes all tokens issued to that user.
   */
  logoutUser: (email: string) => Promise<void>
  userExists: (email: string) => Promise<boolean>
  profileExists: (userName: string) => Promise<boolean>
  createUserAndProfile: (
    email: string
  ) => Promise<{ user: User; profile: UserProfile }>
  /**
   * Update the name of the current user, recalculating hashcode if necessary
   * and compute a new username.
   */
  updateUserProfileName: (
    profileId: string,
    name: string
  ) => Promise<UserProfile>

  // PARTICIPANTS

  /**
   * Adds the participant to the occasion if either:
   *  - an Invitation exists and is accepted
   *  - a SignupRequest exists
   *
   * After adding the particpant, any related SignupRequest or Invitation should
   * be deleted.
   */
  addParticipant: (
    participantProfileId: string,
    occasionId: string
  ) => Promise<Participant>
}
