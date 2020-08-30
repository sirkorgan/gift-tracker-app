import { UserProfile, User } from './domain-types'
import { UserAPI } from './api-types'
// for testing

export interface TestUser {
  user: User
  profile: UserProfile
  api: UserAPI
  token: string
}

export interface TestUsers {
  alice: TestUser
  bob: TestUser
  carol: TestUser
}

export interface TestDatabase {
  name: string
  secret: string
}
