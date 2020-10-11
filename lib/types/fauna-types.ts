import {
  User,
  UserProfile,
  Occasion,
  SignupRequest,
  Invitation,
  Participant,
  Gift,
  Claim,
} from './domain-types'

export interface FaunaRef {
  value: {
    id: string
  }
}

export interface FaunaUser {
  ref?: FaunaRef
  data: User
}

export interface FaunaUserProfile {
  ref?: FaunaRef
  data: UserProfile
}

export interface FaunaOccasion {
  ref?: FaunaRef
  data: Occasion
}

export interface FaunaSignupRequest {
  ref?: FaunaRef
  data: SignupRequest
}

export interface FaunaInvitation {
  ref?: FaunaRef
  data: Invitation
}

export interface FaunaParticipant {
  ref?: FaunaRef
  data: Participant
}

export interface FaunaGift {
  ref?: FaunaRef
  data: Gift
}

export interface FaunaClaim {
  ref?: FaunaRef
  data: Claim
}
