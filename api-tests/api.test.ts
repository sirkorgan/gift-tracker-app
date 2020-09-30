// use the fauna-client to perform a series of operations on the database to
// verify that the APIs function as intended, including permission restrictions.

import { IAdminAPI } from '../lib/types/api-types'
import { TestDatabase, TestUser, TestUsers } from '../lib/types/api-test-types'
import { createFaunaAdminAPI } from '../lib/api/admin-api'
import { createFaunaUserAPI } from '../lib/api/user-api'
import { Occasion } from '../lib/types/domain-types'

import fs from 'fs'

const stream = fs.createWriteStream('log.txt', { flags: 'a' })
function log(msg) {
  stream.write(new Date().toISOString() + ': ' + msg + '\n')
}

log('Test run started')

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

  test('alice creates occasion', async () => {
    occasion = await users.alice.api.createOccasion({
      title: 'my thing',
      description: 'super cool',
      allowSignups: true,
    })
    expect(occasion.id).toBeTruthy()
  })

  test(`can't delete other's occasion`, async () => {
    await expect(users.bob.api.deleteOccasion(occasion.id)).rejects.toThrow()
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

  test('check alice has a sent invitation', async () => {
    const sentInvitations = await users.alice.api.getSentInvitations()
    expect(sentInvitations.length).toBeGreaterThan(0)
  })

  test('bob received an invtations', async () => {
    const receivedInvitations = await users.bob.api.getReceivedInvitations()
    expect(receivedInvitations.length).toBeGreaterThan(0)
  })

  // TODO: check alice received signups
  // TODO: check carol sent signups

  // TODO: deleting an occassion should delete alot of other stuff too, need to verify
  test('alice deletes own occasion', async () => {
    await expect(
      users.alice.api.deleteOccasion(occasion.id)
    ).resolves.not.toThrow()
    occasion = null
  })

  // test gifts
  describe('gifts', () => {
    let occasionId: string
    let giftId: string
    test('alice creates occasion and participants added', async () => {
      const occasion = await users.alice.api.createOccasion({
        title: 'giftTestOccasion-' + Date.now(),
      })
      occasionId = occasion.id
      // use admin API to set participants
      await admin.addParticipant(users.bob.profile.id, occasionId)
      await admin.addParticipant(users.carol.profile.id, occasionId)
    })
    test('alice creates gift for bob', async () => {
      const gift = await users.alice.api.createGift({
        occasionId,
        name: 'ps5',
        suggestedFor: users.bob.profile.id,
      })
      giftId = gift.id
      expect(gift.id).toBeTruthy()
    })
    test('bob can not see gift for himself', async () => {
      const gifts = await users.bob.api.getGiftsForOccasion(occasionId)
      expect(gifts).toHaveLength(0)
    })
    test('carol can see a gift for bob', async () => {
      const gifts = await users.carol.api.getGiftsForOccasion(occasionId)
      expect(gifts).toHaveLength(1)
    })
    test('alice deletes gift', async () => {
      await expect(users.alice.api.deleteGift(giftId)).resolves.not.toThrow()
    })
    test('alice deletes occasion', async () => {
      expect(users.alice.api.deleteOccasion(occasionId)).resolves.not.toThrow()
    })
  })

  // TODO: claims

  // TODO: needs manual testing as api route:
  //  - user request to change name
  //  - user interact with invitation
  //  - organizer accept signup request
})
