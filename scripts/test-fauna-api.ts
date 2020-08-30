// use the fauna-client to perform a series of operations on the database to
// verify that the APIs function as intended, including permission restrictions.

import faunadb from 'faunadb'
import cuid from 'cuid'
import chalk from 'chalk'

import { AdminAPI } from '../lib/types/api-types'
import { TestDatabase, TestUser, TestUsers } from '../lib/types/api-test-types'
import { runUserTests, runAdminTests } from '../api-tests/api-tests'
import { createUserAPI, createAdminAPI } from '../lib/api/fauna-api'
import { updateDb } from './updatedb'

/** True if we are running as a script rather than a module */
const isCLI = () => {
  return process.argv.length > 1 && import.meta.url.includes(process.argv[1])
}

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

const ADMIN_KEY = process.env.FAUNA_ADMIN_KEY
const q = faunadb.query

export async function createTestDb(): Promise<TestDatabase> {
  const client = new faunadb.Client({ secret: ADMIN_KEY })
  // create db
  const name = 'testdb-' + cuid()
  console.log(`Creating test database:`, name)
  await client.query<any>(q.CreateDatabase({ name }))
  // create admin key for new db
  const key = await client.query<any>(
    q.CreateKey({ role: 'admin', database: q.Database(name) })
  )
  const testDb: TestDatabase = {
    name,
    secret: key.secret,
  }
  return testDb
}

export async function createTestUsers(adminApi: AdminAPI): Promise<TestUsers> {
  const client = new faunadb.Client({ secret: ADMIN_KEY })

  const createTestUser = async (name: string): Promise<TestUser> => {
    const userData = await adminApi.createUserAndProfile(`${name}@fakemail.com`)
    const userToken = await client.query<any>(
      q.Create(q.Tokens(), {
        instance: q.Ref(q.Collection('users'), userData.user.id),
      })
    )
    const api = createUserAPI(userToken.secret)
    const testUser: TestUser = {
      user: userData.user,
      profile: userData.profile,
      api,
      token: userToken.secret,
    }
    console.log(
      `Created user ${testUser.user.email} - ${testUser.profile.userName}`
    )
    return testUser
  }

  return {
    alice: await createTestUser('alice'),
    bob: await createTestUser('bob'),
    carol: await createTestUser('carol'),
  }
}

export async function cleanupTestDb(db: TestDatabase) {
  // delete testdb
  const client = new faunadb.Client({ secret: ADMIN_KEY })
  console.log(`Deleting test database:`, db.name)
  await client.query(q.Delete(q.Database(db.name)))
}

if (isCLI()) {
  ;(async () => {
    let testDb: TestDatabase
    try {
      testDb = await createTestDb()
      await updateDb(testDb.secret)
      const adminApi = createAdminAPI(testDb.secret)
      const testUsers = await createTestUsers(adminApi)
      await runAdminTests(adminApi, testUsers)
      await runUserTests(testUsers)
      cleanupTestDb(testDb)
      console.log('Done.')
    } catch (error) {
      console.error(
        chalk.red(error.stack ? error.stack.replace(/file:\/\//gi, '') : error)
      )
      console.error(
        chalk.red(`\nTests failed, see test database:`),
        JSON.stringify(testDb, undefined, 2)
      )
    }
  })()
}
