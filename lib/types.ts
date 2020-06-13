// id corresponds to the id portion of a Fauna ref. Ids are only comparable
// between objects of the same collection.

// These types correspond to the contents of documents from the corresponding
// collections, as returned by query requests.

/**
 * Private user data. Represents application user account linked to auth0
 * identity via email address.
 */
export interface User {
  id?: string
  profileId: string
  email: string
}

/**
 * Publicly available user data associated with a User account.
 *
 *  - all_profiles index only usable by server
 *  - profiles_by_userId index only usable by server
 *  - profiles_by_id index is public
 */
export interface UserProfile {
  id?: string
  userId?: string
  /**
   * User-chosen name, one word.
   */
  username: string
  /**
   * Server-generated 4-digit number to ensure the useName is unique.
   */
  hashCode: number
  /**
   * Combination of name and hashcode, ex. "Laurie#3384"
   */
  userName: string
}

export interface Occasion {
  id?: string
  title: string
  /**
   * Id of user who organzed the occasion.
   */
  organizer: string
  /**
   * List of user ids. Includes the organizer. Participants may use different
   * nicknames per occasion (ex. "Dad" or "Sweetheart")
   */
  participants: { profileId: string; nickname?: string }[]
}

export interface Gift {
  id?: string
  occasionId: string
  name: string
  description: string
  /**
   * Link to an image representing the the gift (ex. imgur).
   */
  imageUrl?: string
  /**
   * Link to a storefront page for the gift (ex. amazon).
   */
  shopUrl?: string
  /**
   * ProfileId of user who suggested the gift.
   */
  suggestedBy: string
  /**
   * ProfileId of user who should receive the gift.
   */
  suggestedFor: string
}

export interface Claim {
  id?: string
  giftId: string
  claimedBy: string
  claimedCount: number
  /**
   * True if other users should not be able to see who made this claim.
   */
  anonymous: boolean
}
