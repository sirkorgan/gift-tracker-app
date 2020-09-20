// use the fauna-client to perform a series of operations on the database to
// verify that the APIs function as intended, including permission restrictions.

import { IAdminAPI } from '../lib/types/api-types'
import { TestDatabase, TestUser, TestUsers } from '../lib/types/api-test-types'
import { createFaunaAdminAPI } from '../lib/api/admin-api'
import { createFaunaUserAPI } from '../lib/api/user-api'
import { Occasion } from '../lib/types/domain-types'

const testDb: TestDatabase = {
  name: process.env.TESTDB_NAME,
  secret: process.env.TESTDB_SECRET,
}
const admin: IAdminAPI = createFaunaAdminAPI(testDb.secret)

async function loadUser(email: string): Promise<TestUser> {
  const user = await admin.getUserByEmail(email)
  const profile = await admin.getUserProfileById(user.profileId)
  const { secret } = await admin.loginUser(email)
  const api = createFaunaUserAPI(secret)
  return {
    user,
    profile,
    api,
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
  test('Can change user profile name', async () => {
    const alice = await loadUser('alice@fakemail.com')
    const newProfile = await admin.updateUserProfileName(
      alice.profile.id,
      'Alice'
    )
    expect(newProfile.name).toEqual('Alice')
    expect(newProfile.userName.startsWith('Alice')).toBeTruthy()
  })
  test('Duplicate name gets a new hashcode', async () => {
    const alice = await loadUser('alice@fakemail.com')
    const newProfile = await admin.updateUserProfileName(
      alice.profile.id,
      alice.profile.name
    )
    expect(newProfile.name).toEqual('Alice')
    expect(newProfile.userName.startsWith('Alice')).toBeTruthy()
    expect(newProfile.hashCode).not.toEqual(alice.profile.hashCode)
  })
})

let users: TestUsers
let occasion: Occasion

describe('user tests', () => {
  beforeAll(async () => {
    users = await loadTestUsers()
  })
  test('getUserByEmail - own email', async () => {
    const user = await users.alice.api.getUserByEmail(users.alice.user.email)
    expect(user).toEqual(users.alice.user)
  })
  test('getUserByEmail - other email', async () => {
    await expect(
      users.alice.api.getUserByEmail(users.bob.user.email)
    ).rejects.toThrow()
  })
  test('getUserProfileByUserName', async () => {
    const userProfile = await users.alice.api.getUserProfileByUserName(
      users.bob.profile.userName
    )
    expect(userProfile).toEqual(users.bob.profile)
  })

  // OCCASIONS

  test('create occasion', async () => {
    occasion = await users.alice.api.createOccasion({
      title: 'my thing',
      description: 'super cool',
      allowSignups: false,
    })
    expect(occasion.id).toBeTruthy()
  })

  test(`can't delete other's occasion`, async () => {
    await expect(users.bob.api.deleteOccasion(occasion.id)).rejects.toThrow()
  })

  // TODO: deleting an occassion should delete alot of other stuff too, need to verify
  test('delete own occasion', async () => {
    await expect(
      users.alice.api.deleteOccasion(occasion.id)
    ).resolves.not.toThrow()
    occasion = null
  })

  test('alice creates occasion', async () => {
    occasion = await users.alice.api.createOccasion({
      title: 'my new thing',
      description: 'super duper cool',
      allowSignups: true,
    })
    expect(occasion.id).toBeTruthy()
  })

  test('alice invites bob', async () => {
    const invitation = await users.alice.api.createInvitation(
      occasion.id,
      users.bob.profile.id
    )
    expect(invitation.id).toBeTruthy()
  })

  test('carol signs up', async () => {
    const signup = await users.carol.api.createSignupRequest(occasion.id)
    expect(signup.id).toBeTruthy()
  })

  // TODO: signups and invitations
  // - check alice sent invitations
  // - check bob received invitations
  // - check alice received signups
  // - check carol sent signups

  // TODO: gifts

  // TODO: claims

  // TODO: needs manual testing as api route:
  //  - user request to change name
  //  - user interact with invitation
  //  - organizer accept signup request
})
