const faunadb = require('faunadb')

/** True if we are running as a script rather than a module */
const isCLI = () => {
  // return process.argv.length > 1 && import.meta.url.includes(process.argv[1])
  return require.main === module
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
  Paginate,
  Collection,
  Match,
  Index,
  Identity,
  Ref,
  Role,
  CreateRole,
} = faunadb.query

const getIdentityProfileId = () =>
  q.Select(
    ['data', 0],
    q.Paginate(q.Match(q.Index('user_profileId'), q.Identity()))
  )

const collections = [
  { name: 'users' },
  { name: 'tokens_issued' },
  { name: 'profiles' },
  { name: 'occasions' },
  { name: 'participants' },
  { name: 'invitations' },
  { name: 'signuprequests' },
  { name: 'gifts' },
  { name: 'claims' },
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
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'user_profileId',
    params: {
      source: 'users',
      terms: [{ field: ['ref'] }],
      values: [{ field: ['data', 'profileId'] }],
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
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'all_occasions',
    params: { source: 'occasions' },
  },
  {
    name: 'occasions_by_id',
    params: {
      source: 'occasions',
      unique: true,
      terms: [{ field: ['ref', 'id'] }],
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'occasions_by_organizer',
    params: {
      source: 'occasions',
      unique: true,
      terms: [{ field: ['data', 'organizer'] }],
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'occasion_organizer',
    params: {
      source: 'occasions',
      terms: [{ field: ['ref'] }],
      values: [{ field: ['data', 'organizer'] }],
    },
  },
  {
    name: 'all_participants',
    params: { source: 'participants' },
  },
  {
    name: 'participants_by_occasionId',
    params: {
      source: 'participants',
      unique: true,
      terms: [{ field: ['data', 'occasionId'] }],
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'participants_occasionId_by_profileId',
    params: {
      source: 'participants',
      unique: true,
      terms: [{ field: ['data', 'profileId'] }],
      values: [{ field: ['data', 'occasionId'] }],
    },
  },
  {
    name: 'participants_profileId_by_occasionId',
    params: {
      source: 'participants',
      unique: true,
      terms: [{ field: ['data', 'occasionId'] }],
      values: [{ field: ['data', 'profileId'] }],
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
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'invitations_by_recipient',
    params: {
      source: 'invitations',
      unique: true,
      terms: [{ field: ['data', 'recipient'] }],
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'invitations_by_occasionId',
    params: {
      source: 'invitations',
      unique: true,
      terms: [{ field: ['data', 'occasionId'] }],
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'invitations_by_occasionId_and_recipient',
    params: {
      source: 'invitations',
      unique: true,
      terms: [
        { field: ['data', 'occasionId'] },
        { field: ['data', 'recipient'] },
      ],
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'signuprequests_by_profileId',
    params: {
      source: 'signuprequests',
      unique: true,
      terms: [{ field: ['data', 'profileId'] }],
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'signuprequests_by_occasionId',
    params: {
      source: 'signuprequests',
      unique: true,
      terms: [{ field: ['data', 'occasionId'] }],
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'all_gifts',
    params: { source: 'gifts' },
  },
  {
    name: 'gifts_by_occasionId',
    params: {
      source: 'gifts',
      unique: true,
      terms: [{ field: ['data', 'occasionId'] }],
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'gift_suggestedFor',
    params: {
      source: 'gifts',
      terms: [{ field: ['ref'] }],
      values: [{ field: ['data', 'suggestedFor'] }],
    },
  },
  {
    name: 'gift_suggestedBy',
    params: {
      source: 'gifts',
      terms: [{ field: ['ref'] }],
      values: [{ field: ['data', 'suggestedBy'] }],
    },
  },
  {
    name: 'gift_occasionId',
    params: {
      source: 'gifts',
      terms: [{ field: ['ref'] }],
      values: [{ field: ['data', 'occasionId'] }],
    },
  },
  {
    name: 'all_claims',
    params: { source: 'claims' },
  },
  {
    name: 'unique_claim_giftId',
    params: {
      source: 'claims',
      unique: true,
      terms: [{ field: ['data', 'giftId'] }],
    },
  },
  {
    name: 'claims_by_occasionId',
    params: {
      source: 'claims',
      unique: true,
      terms: [{ field: ['data', 'occasionId'] }],
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'claims_by_giftId',
    params: {
      source: 'claims',
      unique: true,
      terms: [{ field: ['data', 'giftId'] }],
      values: [{ field: ['ref'] }],
    },
  },
  {
    name: 'claim_giftId',
    params: {
      source: 'claims',
      terms: [{ field: ['ref'] }],
      values: [{ field: ['data', 'giftId'] }],
    },
  },
]

// FUNCTIONS FOR RBAC

/**
 * Will be true if the logged in user is the organizer of the given occasion.
 * @param occasionRef
 */
const userIsOrganizer = (occasionRef) =>
  Equals(
    getIdentityProfileId(),
    Select(
      ['data', 0],
      Paginate(Match(Index('occasion_organizer'), occasionRef))
    )
  )

// ROLES

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
            read: Query(Lambda('ref', Equals(Var('ref'), Identity()))),
          },
        },
        {
          resource: { type: 'collection', name: 'profiles' },
          actions: { read: true },
        },
        {
          resource: { type: 'collection', name: 'occasions' },
          actions: {
            create: true,
            read: true,
            write: Query(Lambda('ref', userIsOrganizer(Var('ref')))),
            delete: Query(Lambda('ref', userIsOrganizer(Var('ref')))),
          },
        },
        {
          resource: { type: 'collection', name: 'participants' },
          actions: {
            // created by backend
            create: false,
            // TODO: allowed if user is participant or organizer
            read: true,
            // TODO: allowed if only changing nickname
            write: false,
            // allowed if user is the participant or organizer
            delete: Query(
              Lambda(
                'ref',
                Or(
                  Equals(
                    Select(['data', 'profileId'], Get(Var('ref'))),
                    getIdentityProfileId()
                  ),
                  userIsOrganizer(
                    Ref(
                      Collection('occasions'),
                      Select(['data', 'occasionId'], Get(Var('ref')))
                    )
                  )
                )
              )
            ),
          },
        },
        {
          resource: { type: 'collection', name: 'invitations' },
          // TODO: access control
          actions: {
            create: true,
            read: true,
            write: true,
            delete: true,
          },
        },
        {
          resource: { type: 'collection', name: 'signuprequests' },
          // TODO: access control
          actions: {
            create: true,
            read: true,
            write: true,
            delete: true,
          },
        },
        {
          resource: { type: 'collection', name: 'gifts' },
          // TODO: access control
          actions: {
            create: true,
            read: true,
            write: true,
            delete: true,
          },
        },
        {
          resource: { type: 'collection', name: 'claims' },
          // TODO: access control
          actions: {
            create: true,
            read: true,
            write: true,
            delete: true,
          },
        },

        // INDEXES

        {
          resource: { type: 'index', name: 'users_by_email' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'user_profileId' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'profiles_by_username' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'occasions_by_id' },
          // TODO: only allow access to participants
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'occasions_by_organizer' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'occasion_organizer' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'signuprequests_by_profileId' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'signuprequests_by_occasionId' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'invitations_by_sender' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'invitations_by_recipient' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'invitations_by_occasionId' },
          actions: { read: true },
        },
        {
          resource: {
            type: 'index',
            name: 'invitations_by_occasionId_and_recipient',
          },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'participants_by_occasionId' },
          actions: { read: true },
        },
        {
          resource: {
            type: 'index',
            name: 'participants_occasionId_by_profileId',
          },
          // TODO: allow read only if profileId is for current user
          actions: { read: true },
        },
        {
          resource: {
            type: 'index',
            name: 'participants_profileId_by_occasionId',
          },
          // TODO: allow read only if user is participant or organizer
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'gifts_by_occasionId' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'gift_suggestedFor' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'gift_suggestedBy' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'gift_occasionId' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'claims_by_occasionId' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'claims_by_giftId' },
          actions: { read: true },
        },
        {
          resource: { type: 'index', name: 'claim_giftId' },
          actions: { read: true },
        },
      ],
    },
  },
}

//////////////////////////////
// Based on https://github.com/RWizard/faunadb-transform
// Absorbed into local codebase for typescript support with ts-esnode

async function doCollections(collections = [], client) {
  // prepare promises
  const promises = collections
    .map((collection) => {
      // generate params object if it wasn't given
      const params = collection.params ?? {}
      params.name = collection.name
      return { ...collection, params }
    })
    .map((collection) => async () => {
      const name = collection.params.name
      try {
        await client.query(
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

  for (const p of promises) {
    await p()
  }
  console.log('Collections - done')
}

async function doIndexes(indexes = [], client) {
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
        await client.query(
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

async function doRoles(roles = {}, client) {
  let rolesArray = Object.keys(roles).map((userColl) => {
    roles[userColl].name = roles[userColl].name || userColl
    roles[userColl].params = roles[userColl].params || {}
    roles[userColl].params.name = roles[userColl].params.name || userColl
    return roles[userColl]
  })

  const promises = rolesArray.map(async (role) => {
    role.params.privileges &&
      role.params.privileges.forEach((priv) => {
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
            default:
              console.error('Unknown resource type: ' + priv.resource.type)
              process.exit(1)
          }
        }
      })

    role.params.membership &&
      role.params.membership.forEach((mem) => {
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

async function updateDb(secret) {
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
async function cleanDb(secret) {
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

async function confirmProductionChange() {
  return new Promise((resolve, reject) => {
    console.log(
      `\n**********\nWARNING: YOU ARE NOW OPERATING ON THE PRODUCTION DATABASE\n**********`
    )
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const verificationNumber = String(Math.floor(1000 + Math.random() * 9000))
    rl.question(
      `If you really mean to continue with the production database, input this number to confirm (${verificationNumber}): `,
      function (userInput) {
        if (userInput === verificationNumber) {
          resolve(true)
        } else {
          resolve(false)
        }
      }
    )
    rl.on('close', function () {
      resolve(false)
    })
  })
}

async function work() {
  try {
    const getTarget = (arg) => {
      switch (arg) {
        case 'local':
          return process.env.FAUNA_ADMIN_KEY
        case 'test':
          return process.env.TESTDB_SECRET
        case 'prod': {
          const prodConfig = require('path').resolve(
            __dirname,
            '../.env.production.local'
          )
          require('dotenv').config({ path: prodConfig })
          return process.env.PRODUCTION_ADMIN_KEY
        }
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
      console.log(`Must provide target as argument: "local" or "test"`)
    } else {
      if (targetArg === 'prod') {
        if (false === (await confirmProductionChange())) {
          console.log('Aborted production change. Nothing has been modified.')
          process.exit(0)
        }
      }

      if (shouldClean) {
        await cleanDb(target)
        console.log('Waiting 1 minute for names to be released.')
        await delay(60 * 1000)
      }
      await updateDb(target)
    }
  } catch (err) {
    console.error(err)
  }
}
if (isCLI()) {
  work()
}

// used by createdb script
module.exports = {
  updateDb,
}
