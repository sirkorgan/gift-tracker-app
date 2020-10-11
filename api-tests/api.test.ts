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
  describe(`gifts`, () => {
    let occasionId: string
    let aliceGiftId: string
    let bobGiftId: string
    let carolClaimId: string

    test(`alice creates occasion`, async () => {
      const occasion = await users.alice.api.createOccasion({
        title: `giftTestOccasion-` + Date.now(),
      })
      occasionId = occasion.id
    })
    test(`admin adds participants bob and carol`, async () => {
      await admin.addParticipant(users.bob.profile.id, occasionId)
      await admin.addParticipant(users.carol.profile.id, occasionId)
    })
    test(`alice creates gift for bob`, async () => {
      const gift = await users.alice.api.createGift({
        occasionId,
        name: 'ps5',
        suggestedFor: users.bob.profile.id,
      })
      aliceGiftId = gift.id
      expect(gift.id).toBeTruthy()
    })
    test(`bob can not see gift from alice for himself`, async () => {
      const gifts = await users.bob.api.getGiftsForOccasion(occasionId)
      expect(gifts).toHaveLength(0)
    })
    test(`bob creates a gift for himself`, async () => {
      const gift = await users.bob.api.createGift({
        occasionId,
        name: 'toaster',
        suggestedFor: users.bob.profile.id,
      })
      bobGiftId = gift.id
      expect(gift.id).toBeTruthy()
    })
    test(`bob can see his gift suggestion for himself`, async () => {
      const gifts = await users.bob.api.getGiftsForOccasion(occasionId)
      expect(gifts).toHaveLength(1)
    })
    test(`carol can see both gift suggestions`, async () => {
      const gifts = await users.carol.api.getGiftsForOccasion(occasionId)
      expect(gifts).toHaveLength(2)
    })

    // TODO: cannot see gifts/anything unless participating in the event

    // CLAIMS
    test(`carol claims gift from alice anonymously`, async () => {
      const claim = await users.carol.api.claimGift({
        giftId: aliceGiftId,
        anonymous: true,
      })
      carolClaimId = claim.id
      expect(claim.id).toBeTruthy()
    })
    test(`alice can see claim with no claimedBy`, async () => {
      const claims = await users.alice.api.getClaimsForOccasion(occasionId)
      expect(claims).toHaveLength(1)
      expect(claims[0].anonymous).toBeTruthy()
      expect(claims[0].claimedBy).toBeUndefined()
    })
    test(`alice can not claim claimed gift`, async () => {
      await expect(
        users.alice.api.claimGift({
          giftId: aliceGiftId,
          anonymous: false,
        })
      ).rejects.toThrow()
    })
    test(`carol deletes claim`, async () => {
      await expect(
        users.carol.api.deleteClaim(carolClaimId)
      ).resolves.not.toThrow()
    })
    test(`alice claims gift`, async () => {
      const claim = await users.alice.api.claimGift({
        giftId: aliceGiftId,
        anonymous: false,
      })
      expect(claim.id).toBeTruthy()
    })
    test(`carol can see that alice claimed the gift`, async () => {
      const claims = await users.carol.api.getClaimsForOccasion(occasionId)
      expect(claims).toHaveLength(1)
      expect(claims[0].anonymous).toBeFalsy()
      expect(claims[0].claimedBy).toEqual(users.alice.profile.id)
    })
    test(`bob can not see claim on gift from alice`, async () => {
      const claims = await users.bob.api.getClaimsForOccasion(occasionId)
      expect(claims).toHaveLength(0)
    })
    test(`carol claims bob's own gift suggestion`, async () => {
      const claim = await users.carol.api.claimGift({ giftId: bobGiftId })
      expect(claim.id).toBeTruthy()
    })
    test(`bob can not see carol's claim on his gift suggestion`, async () => {
      const claims = await users.bob.api.getClaimsForOccasion(occasionId)
      expect(claims).toHaveLength(0)
    })

    // DELETIONS
    // TODO: carol can not delete alice's gift

    test('bob deletes gift', async () => {
      await expect(users.bob.api.deleteGift(bobGiftId)).resolves.not.toThrow()
    })
    test('alice deletes gift', async () => {
      await expect(
        users.alice.api.deleteGift(aliceGiftId)
      ).resolves.not.toThrow()
    })
    test('alice deletes occasion', async () => {
      expect(users.alice.api.deleteOccasion(occasionId)).resolves.not.toThrow()
    })
  })

  // TODO: needs manual testing as api route:
  //  - user request to change name
  //  - user interact with invitation
  //  - organizer accept signup request
})
