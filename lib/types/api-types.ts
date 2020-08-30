import { UserProfile, User, Occasion } from './domain-types'

export interface UserAPI {
  getUserProfileByUserName: (userName: string) => Promise<UserProfile>
  getUserProfileById: (id: string) => Promise<UserProfile>
  /**
   * Only return occasion if the current user is orgnaizing or particpating.
   */
  // getOccasionById: (id: string) => Promise<Occasion>
  /**
   *  Only return occasions if the organizer is the current user.
   */
  // getOccasionByOrganizer: (profileId: string) => Promise<Occasion>
  /**
   * Allow only organizer to change:
   *  - title
   *  - description
   *  - allowSignups
   */
  // updateOccasion: (occasion: Occasion) => Promise<Occasion>
  /**
   * Current user will become the organizer of the new occasion.
   */
  // createOccasion: (occassion: Occasion) => Promise<Occasion>
  /**
   * Only organizer can delete an occasion. All associated documents will also
   * be deleted.
   */
  // deleteOccasion: (occasionId: string) => void
}

export interface AdminAPI {
  getUserByEmail: (email: string) => Promise<User>
  getUserProfileById: (profileId: string) => Promise<UserProfile>
  /**
   * Returns Ref of Token issued for user.
   * @param email
   */
  getUserTokenByEmail: (email: string) => Promise<string>
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
    userToken: string,
    name: string
  ) => Promise<UserProfile>
}
