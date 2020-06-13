require('dotenv').config()
const ft = require('faunadb-transform').default

const collections = {
  users: { create: true, update: true },
  tokens_issued: { create: true, update: true },
  profiles: { create: true, update: true },
  // occasions: { create: true, update: true },
  // gifts: { create: true, update: true },
  // claims: { create: true, update: true },
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
    },
  },
  all_profiles: {
    create: true,
    update: true,
    params: { source: 'profiles' },
  },
  profiles_by_username: {
    create: true,
    update: true,
    params: {
      source: 'profiles',
      unique: true,
      terms: [{ field: ['data', 'username'] }],
    },
  },
  // all_occasions: {
  //   create: true,
  //   update: true,
  //   params: { source: 'occasions' },
  // },
  // occasions_by_organizer: {
  //   create: true,
  //   update: true,
  //   params: {
  //     source: 'occasions',
  //     unique: true,
  //     terms: [{ field: ['data', 'organizer'] }],
  //   },
  // },
  // all_gifts: {
  //   create: true,
  //   update: true,
  //   params: { source: 'gifts' },
  // },
  // all_claims: {
  //   create: true,
  //   update: true,
  //   params: { source: 'claims' },
  // },
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
  target: process.env.FAUNA_ADMIN_KEY,
}

ft(json, settings).then((result) => {})

export {}
