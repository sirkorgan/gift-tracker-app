// use the fauna-client to perform a series of operations on the database to
// verify that the APIs function as intended, including permission restrictions.

import faunadb from 'faunadb'
// import chalk from 'chalk'

import { AdminAPI } from '../lib/types/api-types'
import { TestDatabase, TestUser, TestUsers } from '../lib/types/api-test-types'
import { createUserAPI, createAdminAPI } from '../lib/api/fauna-api'

/** True if we are running as a script rather than a module */
// const isCLI = () => {
//   return process.argv.length > 1 && import.meta.url.includes(process.argv[1])
// }

// const delay = (ms: number) =>
//   new Promise<void>((resolve) => setTimeout(resolve, ms))

const ADMIN_KEY = process.env.FAUNA_ADMIN_KEY
const q = faunadb.query

const db: TestDatabase = {
  name: process.env.TESTDB_NAME,
  secret: process.env.TESTDB_SECRET,
}
const testClient = new faunadb.Client({ secret: db.secret })
const adminApi: AdminAPI = createAdminAPI(db.secret)

async function loadUser(email: string): Promise<TestUser> {
  try {
    const user = await adminApi.getUserByEmail(email)
    const profile = await adminApi.getUserProfileById(user.profileId)
    const token = await adminApi.getUserTokenByEmail(email)
    const api = createUserAPI(token)
    return {
      user,
      profile,
      token,
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

let testUsers: TestUsers
beforeAll(async () => {
  testUsers = await loadTestUsers()
})

describe('admin tests', () => {
  test('- Alice can change her profile name', async () => {
    try {
      const { alice } = testUsers
      const newProfile = await adminApi.updateUserProfileName(
        alice.profile.id,
        alice.token,
        'Alice'
      )
      expect(newProfile.name).toEqual('Alice')
      expect(newProfile.userName.startsWith('Alice')).toBeTruthy()
    } catch (err) {
      console.error(err)
      throw err
    }
  })
})

describe('user tests', () => {})
