// test runner singleton state

import chalk from 'chalk'
import { AdminAPI } from './api-types'
import { TestUsers } from './test-types'

// test cases for users alice, bob, and carol
// - try to make them work with a possible future offline api implementation

// Tell a story of alice, bob, and carol who have just created accounts and

// for development:
//  - one-time setup
//  - repeat a single test
interface TestDefinition {
  description: string
  fn: Function
}

interface TestGroup {
  description: string
  tests: TestDefinition[]
}

let onlyTest: TestDefinition
let onlyGroup: TestGroup
const baseTestGroup: TestGroup = {
  description: 'Begin Tests =============',
  tests: [],
}

function assert(expr: boolean, message: string = undefined) {
  if (!expr) throw new Error(`Assertion failed${message ? ': ' + message : ''}`)
}

async function test(description: string, fn: Function): Promise<void> {
  console.log(chalk.blueBright(description))
  await fn()
}

export async function runAdminTests(adminApi: AdminAPI, users: TestUsers) {
  const { alice, bob, carol } = users

  console.log(chalk.yellowBright('Begin admin tests ============'))

  await test('- Alice can change her profile name', async () => {
    const newProfile = await adminApi.updateUserProfileName(
      alice.profile.id,
      alice.token,
      'Alice'
    )
    assert(newProfile.name === 'Alice')
    assert(newProfile.userName.startsWith('Alice'))
  })

  console.log(chalk.yellowBright('Finished admin tests ============'))
}

export async function runUserTests(users: TestUsers) {
  const { alice, bob, carol } = users

  console.log(chalk.yellowBright('Begin tests ============'))

  // The order of tests matters, since we are writing to the DB.
  // Try to write isolated tests as much as possible.

  console.log(chalk.yellowBright('Finished tests ============'))
}
