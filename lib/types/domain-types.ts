// id corresponds to the id portion of a Fauna ref. Ids are only comparable
// between objects of the same collection.

// These types correspond to the contents of documents from the corresponding
// collections, as returned by query requests, PLUS the id portion of the
// document ref so that the domain structure can remain agnostic of the DB.

// id must be stripped out by API layer when performing write operations because
// it is not part of the fauna "data" attribute of the document.

// - leaders have power to invite and exclude
// - users should only be included voluntarily (accept or reject invitations)
// - user visibility and information is private unless voluntarily released to
//   specific parties

// Avoid building a social platform? Use shareable link to let users request
// inclusion instead of replicating a friends-network for leaders to push
// invites.

// PERMISSIONS:
//  - disallow specific access/changes
//  - allows ANY access/changes not disallowed

// INTEGRITY:
//  - client cannot guarantee side-effects
//  - backend guarantees side-effects
//  - investigate side-effects via fauna functions instead of Vercel lambdas.
//    For example, consider delete operation that should cascade - client cannot
//    be trusted to properly cascade, but this could be done reliably on backend
//    by client invoking a delete function.

// SECURITY:
//  - see rate-limiting:
//    https://gist.github.com/fauna-brecht/c048f7d721061c4e475278a4eb896fd9

/**
 * Private user data. Represents application user account linked to auth0
 * identity via email address.
 */
export interface User {
  id?: string
  profileId?: string
  email: string
}

/**
 * Publicly available user data associated with a User account.
 *
 *  - not directly editable by user. User should be able to change name portion
 *    via API.
 *
 * Read:
 *  - User can read own profile.
 *
 * Write:
 *  - User can change own name via function, which recalculates userName and
 *    possibly generates a new hashCode to ensure uniqueness.
 */
export interface UserProfile {
  id?: string
  userId?: string
  /**
   * User-chosen name, one word. User-changeable via API.
   */
  name: string
  /**
   * Server-generated 4-digit number to ensure the userName is unique.
   */
  hashCode: number
  /**
   * Combination of name and hashcode, ex. "Laurie#3384". Computed and stored
   * for use by index.
   */
  userName: string
  /**
   * Preferred public-facing name. Used as default participant name. If not set,
   * userName will be used.
   */
  nickname?: string
}

/**
 * - Participants added voluntarily by accepting invitations via API.
 * - Participants removed by organizer via API.
 *
 * Read:
 *  - Organizers, Participants, and users who have received an Invitation
 *
 * Write:
 *  - Organizers may change title and description
 *
 * Create:
 *  - Any user can create an Occasion
 *
 * Delete:
 *  - Organizers may delete via function which removes all associated
 *    invitations, participants, gifts, and claims.
 */
export interface Occasion {
  id?: string
  /**
   * ProfileId of user who organzed the occasion. Readonly.
   */
  organizer: string
  /**
   * Title of the occasion.
   */
  title: string
  description: string
  /**
   * If true, generate a signup link for the occasion and allow users who have
   * the link to request to participate in the event. Organizers may approve or
   * reject the signup requests.
   */
  allowSignups: boolean
}

/**
 * Tracks which profiles are participating in which occasions.
 *
 * Read:
 *  - User can see their own participation status
 *  - User can see all Participants of an event in which they also participate.
 *
 * Write:
 *  - User can change their nickname.
 *
 * Create:
 *  - Created when a user accepts an Invitation.
 *
 * Delete:
 *  - Organizer can remove a participant using a function.
 *  - User can remove their participant status using a function.
 */
export interface Partcipant {
  id?: string
  occasionId: string
  profileId: string
  /**
   * Particpant may use custom nickname for an Occasion.
   */
  nickname?: string
}

/**
 * A user may become a Participant in an Occasion by accepting an Invitation
 * from an organizer.
 *
 * Documents from this collection should have a TTL set to facilitate the ignore
 * functionality.
 *
 * Read:
 *  - Users can read invitations that they have sent or received.
 *
 * Write:
 *  - None
 *
 * Create:
 *  - Organizers can create invitations.
 *
 * Delete:
 *  - Sender can delete invitation.
 *  - Recipient can delete invitation.
 */
export interface Invitation {
  id?: string
  sender: string
  recipient: string
  occasionId: string
  /**
   * The organizer who sends the invitation will see the 'ignored' state as
   * 'pending' in order to allow a user to soft-refuse an invitation by ignoring
   * it. If the recipient ignores the invitation, they will no longer be shown
   * that invitation.
   */
  status: 'pending' | 'ignored' | 'accepted'
}

/**
 * A user may request to participate in an Occasion, if the Occasion allows
 * signups and the user has access to the signup link.
 *
 * Read:
 *  - Occasion organizer and requesting user may see SignupRequests.
 *
 * Write:
 *  - None
 *
 * Create:
 *  - Users via function
 *
 * Delete:
 *  - Organizers (refuse) and users (withdraw)
 */
export interface SignupRequest {
  id?: string
  profileId: string
  occasionId: string
}

/**
 * Participants in an Occasion may suggest Gifts for themselves or other
 * Participants.
 *
 * Read:
 *  - A participant for whom a gift is suggested may not see that gift, unless
 *    the participant has suggested that gift for himself.
 *  - All participants of the occasion may see gifts for other participants of that occasion.
 *
 * Write:
 *  - Can change name/description/imageUrl/shopUrl if participant originally suggested the gift.
 *
 * Create:
 *  - All participants can create Gift suggestions.
 *
 * Delete:
 *  - Organizers can delete a Gift using a function, which will also delete all Claims of that gift.
 *  - Participants who suggest a gift may delete that gift, as long as no other participants have Claimed it.
 */
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

/**
 * Participants of an Occasion may claim Gift suggestions for that Occasion,
 * which means they are promising to give that gift to the user for whom it is
 * suggested.
 *
 * Read:
 *  - Participants in the same event can see each other's claims
 *  - The recipient of a gift may not read any claims on that gift
 *
 * Write:
 *  - none
 *
 * Create:
 *  - Participants of the occasion may create a claim on any gift suggested for
 *    that occasion,
 *  - The recipient of a gift may not create a claim on that gift.
 *
 * Delete:
 *  - The user who created the claim on a gift may delete that claim.
 */
export interface Claim {
  id?: string
  giftId: string
  /**
   * True if other users should not be able to see who made this claim.
   */
  anonymous: boolean
  /**
   * If anonymous is true, the claimedBy field should not be shown to other
   * Participants.
   */
  claimedBy?: string
}
