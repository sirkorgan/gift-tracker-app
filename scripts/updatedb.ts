require('dotenv').config()
const ft = require('faunadb-transform').default

const collections = {
  users: { create: true, update: true },
  tokens_issued: { create: true, update: true },
  // have to use _ because "events" is a reserved name
  _events: { create: true, update: true },
}

const indexes = {
  all_users: { create: true, update: true, params: { source: 'users' } },
  user_by_email: {
    create: true,
    update: true,
    params: {
      source: 'users',
      unique: true,
      terms: [{ field: ['data', 'email'] }],
      data: { description: 'Index by unique email' },
    },
  },
  all_tokens_issued: {
    create: true,
    update: true,
    params: { source: 'tokens_issued' },
  },
  tokens_issued_by_email: {
    create: true,
    update: true,
    params: {
      source: 'tokens_issued',
      unique: false,
      terms: [{ field: ['data', 'email'] }],
      data: { description: 'Index by email' },
    },
  },
  all_events: { create: true, update: true, params: { source: 'users' } },
}

const roles = {
  user: {
    create: true,
    update: true,
    params: {
      privileges: [
        {
          resource: { type: 'collection', name: 'users' },
          actions: {
            read: true,
            create: false,
            write: `
Query( 
  Lambda(
    'userRef',
    Equals(
      Get('userRef'),
      Get(Identity())
    )
  )
) `,
          },
        },
      ],
      membership: [
        {
          resource: 'users',
          predicate: `
Query( 
  Lambda(
    'ref',
    Select(
      ["data", "vip"], 
      Get(Var('ref'))
    )
  )
) `,
        },
      ],
    },
  },
}

const json = {
  collections,
  indexes,
  // roles
}

const settings = {
  debug: true,
  // admin key
  target: process.env.FAUNA_ADMIN_KEY,
}

ft(json, settings).then((result) => {})

export {}
