import { IAdminAPI } from '../lib/types/api-types'
import { TestUser } from '../lib/types/api-test-types'
import { createFaunaAdminAPI } from '../lib/api/admin-api'
import { createFaunaUserAPI } from '../lib/api/user-api'

async function createTestUsers(target): Promise<void> {
  try {
    const createTestUser = async (
      adminApi: IAdminAPI,
      name: string
    ): Promise<void> => {
      const email = `${name}@fakemail.com`
      if (await adminApi.userExists(email)) {
        console.log(`User ${name} already exists`)
        return
      }
      const userData = await adminApi.createUserAndProfile(email)
      const userToken = await adminApi.loginUser(email)
      const api = createFaunaUserAPI(userToken.secret)
      const testUser: TestUser = {
        user: userData.user,
        profile: userData.profile,
        api,
      }
      console.log(
        `Created user ${testUser.user.email} - ${testUser.profile.userName}`
      )
    }

    const adminApi = createFaunaAdminAPI(target)
    const users = ['alice', 'bob', 'carol']
    for (const name of users) {
      await createTestUser(adminApi, name)
    }
  } catch (err) {
    console.error(`Failed to create testusers:`, err)
    process.exit(1)
  }
}

jest.setTimeout(10000)
createTestUsers(process.env.TESTDB_SECRET)
