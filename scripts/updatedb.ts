import faunadb from 'faunadb'

import { AdminAPI } from '../lib/types/api-types'
import { TestUser, TestUsers } from '../lib/types/api-test-types'
import { createAdminAPI } from '../lib/api/admin-api'
import { createUserAPI } from '../lib/api/user-api'

/** True if we are running as a script rather than a module */
const isCLI = () => {
  return process.argv.length > 1 && import.meta.url.includes(process.argv[1])
}

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

const q = faunadb.query

const {
  Concat,
  Map,
  CreateCollection,
  CreateIndex,
  Lambda,
  Let,
  Do,
  If,
  Select,
  Var,
  Exists,
  Delete,
  Update,
  Abort,
  Not,
  And,
  Or,
  Query,
  Equals,
  Get,
  Collection,
  Index,
  Identity,
  Ref,
  Role,
  CreateRole,
} = faunadb.query

const collections: any = [
  { name: 'users' },
  { name: 'tokens_issued' },
  { name: 'profiles' },
  { name: 'occasions' },
  { name: 'invitations' },
  // { name: 'gifts' },
  // { name: 'claims' },
]

const indexes = [
  {
    name: 'all_users',
    params: { source: 'users' },
  },
  {
    name: 'users_by_email',
    params: {
      source: 'users',
      unique: true,
      terms: [{ field: ['data', 'email'] }],
    },
  },
  {
    name: 'all_tokens_issued',
    params: { source: 'tokens_issued' },
  },
  {
    name: 'tokens_issued_by_email',
    params: {
      source: 'tokens_issued',
      unique: false,
      terms: [{ field: ['data', 'email'] }],
    },
  },
  {
    name: 'all_profiles',
    params: { source: 'profiles' },
  },
  {
    name: 'profiles_by_username',
    params: {
      source: 'profiles',
      unique: true,
      terms: [{ field: ['data', 'userName'] }],
    },
  },
  {
    name: 'all_occasions',
    params: { source: 'occasions' },
  },
  {
    name: 'occasions_by_organizer',
    params: {
      source: 'occasions',
      unique: true,
      terms: [{ field: ['data', 'organizer'] }],
    },
  },
  {
    name: 'all_invitations',
    params: { source: 'invitations' },
  },
  {
    name: 'invitations_by_sender',
    params: {
      source: 'invitations',
      unique: true,
      terms: [{ field: ['data', 'sender'] }],
    },
  },
  {
    name: 'invitations_by_recipient',
    params: {
      source: 'invitations',
      unique: true,
      terms: [{ field: ['data', 'recipient'] }],
    },
  },
  // {
  //   name: 'all_gifts',
  //   params: { source: 'gifts' },
  // },
  // {
  //   name: 'all_claims',
  //   params: { source: 'claims' },
  // },
]

// - https://docs.fauna.com/fauna/current/api/fql/functions/createrole
// - https://docs.fauna.com/fauna/current/security/roles
const roles = {
  user: {
    create: true,
    update: true,
    params: {
      membership: [{ resource: 'users' }],
      privileges: [
        {
          resource: { type: 'collection', name: 'users' },
          actions: {
            read: Query(
              Lambda('userRef', Equals(Get(Var('userRef')), Get(Identity())))
            ),
          },
        },
        {
          resource: { type: 'index', name: 'users_by_email' },
          actions: {
            read: true,
          },
        },
        {
          resource: { type: 'collection', name: 'profiles' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'profiles_by_username' },
          actions: {
            read: true,
          },
        },
        {
          resource: { type: 'collection', name: 'occasions' },
          actions: {
            read: true,
            create: true,
            // participants added via backend API to accept invitations
            write: false,
            // must delete using backend API to ensure proper cleanup
            delete: false,
          },
        },
      ],
    },
  },
}

//////////////////////////////
// Based on https://github.com/RWizard/faunadb-transform
// Absorbed into local codebase for typescript support with ts-esnode

async function doCollections(collections = [], client: faunadb.Client) {
  // prepare promises
  const promises = collections
    .map((collection) => {
      // generate params object if it wasn't given
      const params = collection.params ?? {}
      params.name = collection.name
      return { ...collection, params }
    })
    .map(async (collection) => {
      const name = collection.params.name
      try {
        await client.query<any>(
          Map(
            [collection],
            Lambda(
              'collection',
              Let(
                {
                  create: Select(['create'], Var('collection'), true),
                  update: Select(['update'], Var('collection'), true),
                  remove: Select(['remove'], Var('collection'), false),
                  params: Select(['params'], Var('collection')),
                  name: Select(['name'], Var('collection')),
                  exist: Exists(Collection(Var('name'))),
                },
                If(
                  Var('remove'),
                  If(
                    Var('exist'),
                    Delete(Collection(Var('name'))),
                    Abort('No collection for remove')
                  ),
                  If(
                    And(Var('create'), Not(Var('exist'))),
                    CreateCollection(Var('params')),
                    If(
                      And(Var('update'), Var('exist')),
                      Update(Collection(Var('name')), Var('params')),
                      Abort('No actions for collection')
                    )
                  )
                )
              )
            )
          )
        )
        console.log(`Collection ${name} - done`)
      } catch (err) {
        JSON.parse(err.requestResult.responseRaw).errors.map((error) =>
          console.error(`${name}: ${error.description}`, null, {
            error: true,
          })
        )
      }
    })

  // wait for all promises to resolve
  await Promise.all(promises)
  console.log('Collections - done')
}

async function doIndexes(indexes = [], client: faunadb.Client) {
  const promises = indexes
    .map((index) => {
      // generate params object if it wasn't given
      const params = index.params ?? {}
      params.name = index.name
      return { ...index, params }
    })
    .map((index) => async () => {
      const name = index.params.name
      try {
        await client.query<any>(
          Map(
            [index],
            Lambda(
              'index',
              Let(
                {
                  update: Select(['update'], Var('index'), true),
                  remove: Select(['remove'], Var('index'), false),
                  params_update: {
                    unique: Select(['params', 'unique'], Var('index'), false),
                    name: Select(['params', 'name'], Var('index')),
                    data: Select(['params', 'data'], Var('index'), {}),
                    permissions: Select(
                      ['params', 'permissions'],
                      Var('index'),
                      {}
                    ),
                    serialized: Select(
                      ['params', 'serialized'],
                      Var('index'),
                      false
                    ),
                  },
                  params: {
                    source: Collection(
                      Select(['params', 'source'], Var('index'), null)
                    ),
                    unique: Select(['params', 'unique'], Var('index'), false),
                    serialized: Select(
                      ['params', 'serialized'],
                      Var('index'),
                      false
                    ),
                    permissions: Select(
                      ['params', 'permissions'],
                      Var('index'),
                      {}
                    ),
                    data: Select(['params', 'data'], Var('index'), {}),
                    name: Select(['params', 'name'], Var('index')),
                    terms: Select(['params', 'terms'], Var('index'), null),
                    values: Select(['params', 'values'], Var('index'), null),
                  },
                  name: Select(['name'], Var('index')),
                  exist: Exists(Index(Var('name'))),
                  recreate: If(
                    And(
                      Select(['recreate'], Var('index'), false),
                      Var('exist')
                    ),
                    Do(
                      Update(Index(Var('name')), {
                        name: Concat([Var('name'), '_old'], ''),
                      }),
                      true
                    ),
                    false
                  ),
                  create: If(
                    Var('recreate'),
                    true,
                    Select(['create'], Var('index'), true)
                  ),
                },
                If(
                  Var('remove'),
                  If(
                    Var('exist'),
                    Delete(Index(Var('name'))),
                    Abort('No index for remove')
                  ),
                  If(
                    And(Var('create'), Or(Not(Var('exist')), Var('recreate'))),
                    CreateIndex(Var('params')),
                    If(
                      And(Var('update'), Var('exist')),
                      Update(Index(Var('name')), Var('params_update')),
                      Abort('No actions for index')
                    )
                  )
                )
              )
            )
          )
        )
        console.log(`Index ${name} - done`)
      } catch (err) {
        JSON.parse(err.requestResult.responseRaw).errors.map((error) =>
          console.error(`${name}: ${error.description}`, null)
        )
      }
    })

  // execute promises in order
  for (const p of promises) {
    await p()
  }
  console.log('Indexes - done')
}

export async function doRoles(roles = {}, client: faunadb.Client) {
  let rolesArray = Object.keys(roles).map((userColl) => {
    roles[userColl].name = roles[userColl].name || userColl
    roles[userColl].params = roles[userColl].params || {}
    roles[userColl].params.name = roles[userColl].params.name || userColl
    return roles[userColl]
  })

  const promises = rolesArray.map(async (role) => {
    role.params.privileges &&
      role.params.privileges.map((priv) => {
        if (typeof priv.resource === 'object' && priv.resource.type) {
          switch (priv.resource.type) {
            case 'collection':
              priv.resource = Collection(priv.resource.name)
              break
            case 'index':
              priv.resource = Index(priv.resource.name)
              break
            case 'function':
              priv.resource = Ref(Ref('functions'), priv.resource.name)
              break
          }
        }
      })

    role.params.membership &&
      role.params.membership.map((mem) => {
        if (typeof mem.resource === 'string')
          mem.resource = Collection(mem.resource)
      })

    return await client
      .query(
        Map(
          [role],
          Lambda(
            'role',
            Let(
              {
                create: Select(['create'], Var('role'), true),
                update: Select(['update'], Var('role'), true),
                remove: Select(['remove'], Var('role'), false),
                params: Select(['params'], Var('role')),
                name: Select(['name'], Var('role')),
                exist: Exists(Role(Var('name'))),
              },
              If(
                Var('remove'),
                If(
                  Var('exist'),
                  Delete(Role(Var('name'))),
                  Abort('No user-role for remove')
                ),
                If(
                  And(Var('create'), Not(Var('exist'))),
                  CreateRole(Var('params')),
                  If(
                    And(Var('update'), Var('exist')),
                    Update(Role(Var('name')), Var('params')),
                    Abort('No actions for user-role')
                  )
                )
              )
            )
          )
        )
      )
      .then((res) => {
        console.log('Role', role.name + ' - done')
        return res
      })
      .catch((err) => {
        console.error(err)
        throw err
      })
  })

  return Promise.all(promises)
    .then((res) => {
      console.log(`Roles - done`)
      return res
    })
    .catch((err) => console.log('Promises all Roles error :', err))
}

export async function createTestUsers(target): Promise<void> {
  try {
    const createTestUser = async (
      adminApi: AdminAPI,
      name: string
    ): Promise<void> => {
      try {
        const email = `${name}@fakemail.com`
        if (Boolean(await adminApi.getUserByEmail(email))) {
          console.log(`User ${name} already exists`)
          return
        }
        const userData = await adminApi.createUserAndProfile(email)
        const userToken = await adminApi.loginUser(email)
        const api = createUserAPI(userToken.secret)
        const testUser: TestUser = {
          user: userData.user,
          profile: userData.profile,
          api,
        }
        console.log(
          `Created user ${testUser.user.email} - ${testUser.profile.userName}`
        )
      } catch (err) {
        console.error(`Could not create test user ${name}:`, err)
      }
    }

    const adminApi = createAdminAPI(target)
    const users = ['alice', 'bob', 'carol']
    for (const name of users) {
      await createTestUser(adminApi, name)
    }
  } catch (err) {
    console.error(`Failed to create testusers:`, err)
    process.exit(1)
  }
}

export async function updateDb(secret) {
  const client = new faunadb.Client({ secret })
  const json = {
    collections,
    indexes,
    roles,
  }
  await doCollections(json.collections, client)
  await doIndexes(json.indexes, client)
  await doRoles(json.roles, client)
}

/**
 * Deletes the contents of a database.
 * @param secret
 */
export async function cleanDb(secret) {
  try {
    console.log('Cleaning database...')
    const client = new faunadb.Client({ secret })
    const toDelete = [q.Indexes(), q.Collections(), q.Roles()]

    for (const collection of toDelete) {
      await client.query(
        q.Foreach(
          q.Paginate(collection),
          q.Lambda((ref) => {
            return q.Delete(ref)
          })
        )
      )
    }
  } catch (err) {
    console.error(`Failed to clean database:`, err)
  }
}

async function work() {
  const getTarget = (arg) => {
    switch (arg) {
      case 'prod':
        return process.env.FAUNA_ADMIN_KEY
      case 'test':
        return process.env.TESTDB_SECRET
      default:
        console.error('Unknown DB target: ' + arg)
        return undefined
    }
  }

  let targetArg
  if (process.argv.length >= 2) {
    targetArg = process.argv[2]
  }

  let shouldClean = false
  if (process.argv.length >= 3) {
    shouldClean = Boolean(process.argv[3])
  }

  const target = getTarget(targetArg)
  if (!target) {
    console.log(`Must provide target as argument: "prod" or "test"`)
  } else {
    if (shouldClean) {
      await cleanDb(target)
      console.log('Waiting 1 minute for names to be released.')
      await delay(60 * 1000)
    }
    await updateDb(target)
    if (targetArg === 'test') await createTestUsers(target)
  }
}
if (isCLI()) {
  work()
}
