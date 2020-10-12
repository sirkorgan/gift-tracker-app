const faunadb = require('faunadb')
const cuid = require('cuid')
// const chalk = require( 'chalk')
const { updateDb } = require('./updatedb')

/** True if we are running as a script rather than a module */
const isCLI = () => {
  // return process.argv.length > 1 && import.meta.url.includes(process.argv[1])
  return require.main === module
}

const q = faunadb.query

export async function createTestDb(ADMIN_KEY) {
  try {
    const client = new faunadb.Client({ secret: ADMIN_KEY })
    // create db
    const name = 'testdb-' + cuid()
    console.log(`Creating test database:`, name)
    await client.query(q.CreateDatabase({ name }))
    // create admin key for new db
    const key = await client.query(
      q.CreateKey({ role: 'admin', database: q.Database(name) })
    )
    const testDb = {
      name,
      secret: key.secret,
    }
    return testDb
  } catch (err) {
    console.error('Failed to create testDb:', err)
  }
}

if (isCLI()) {
  let testDb
  createTestDb(process.env.FAUNA_ADMIN_KEY)
    .then((db) => {
      testDb = db
      console.log(`\nCopy the below lines into your .env file:`)
      console.log(`TESTDB_NAME=${db.name}`)
      console.log(`TESTDB_SECRET=${db.secret}`)
    })
    .then(() => {
      console.log('\nSetting up database...')
      updateDb(testDb.secret)
    })
}
