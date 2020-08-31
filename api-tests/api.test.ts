// use the fauna-client to perform a series of operations on the database to
// verify that the APIs function as intended, including permission restrictions.

import { AdminAPI } from '../lib/types/api-types'
import { TestDatabase, TestUser, TestUsers } from '../lib/types/api-test-types'
import { createAdminAPI } from '../lib/api/admin-api'
import { createUserAPI } from '../lib/api/user-api'

const testDb: TestDatabase = {
  name: process.env.TESTDB_NAME,
  secret: process.env.TESTDB_SECRET,
}
const admin: AdminAPI = createAdminAPI(testDb.secret)

async function loadUser(email: string): Promise<TestUser> {
  try {
    const user = await admin.getUserByEmail(email)
    const profile = await admin.getUserProfileById(user.profileId)
    const { secret } = await admin.loginUser(email)
    const api = createUserAPI(secret)
    return {
      user,
      profile,
      api,
    }
  } catch (err) {
    console.error(err)
    throw err
  }
}

async function loadTestUsers(): Promise<TestUsers> {
  const users: TestUsers = {
    alice: await loadUser('alice@fakemail.com'),
    bob: await loadUser('bob@fakemail.com'),
    carol: await loadUser('carol@fakemail.com'),
  }
  return users
}

describe('admin tests', () => {
  test('Alice can change her profile name', async () => {
    try {
      const alice = await loadUser('alice@fakemail.com')
      const newProfile = await admin.updateUserProfileName(
        alice.profile.id,
        'Alice'
      )
      expect(newProfile.name).toEqual('Alice')
      expect(newProfile.userName.startsWith('Alice')).toBeTruthy()
    } catch (err) {
      console.error(err)
      throw err
    }
  })
  test('Duplicate name gets a new hashcode', async () => {
    try {
      const alice = await loadUser('alice@fakemail.com')
      const newProfile = await admin.updateUserProfileName(
        alice.profile.id,
        alice.profile.name
      )
      expect(newProfile.name).toEqual('Alice')
      expect(newProfile.userName.startsWith('Alice')).toBeTruthy()
      expect(newProfile.hashCode).not.toEqual(alice.profile.hashCode)
    } catch (err) {
      console.error(err)
      throw err
    }
  })
})

let users: TestUsers
describe('user tests', () => {
  beforeAll(async () => {
    users = await loadTestUsers()
  })
  test('getUserByEmail - own email', async () => {
    const user = await users.alice.api.getUserByEmail(users.alice.user.email)
    expect(user).toEqual(users.alice.user)
  })
  test.only('getUserByEmail - other email', async () => {
    expect(
      users.alice.api.getUserByEmail(users.bob.user.email)
    ).rejects.toThrow()
  })
  test('getUserProfileByUserName', async () => {
    const userProfile = await users.alice.api.getUserProfileByUserName(
      users.bob.profile.userName
    )
    expect(userProfile).toEqual(users.bob.profile)
  })
})
