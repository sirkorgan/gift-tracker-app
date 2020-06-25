import { User, UserProfile } from '../domain-types'

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
