export {}

const ft = require('faunadb-transform').default

const collections = {
  users: { create: true, update: true },
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
  debug: true, // admin key
  target: 'fnADsJlOiRACFIQ_DokSvBDITL3SItVNwp5-PNu1',
}

ft(json, settings).then((result) => {})
