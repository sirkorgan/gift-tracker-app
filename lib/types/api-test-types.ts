import { UserProfile, User } from './domain-types'
import { IUserAPI } from './api-types'

// for testing

export interface TestUser {
  user: User
  profile: UserProfile
  api: IUserAPI
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
