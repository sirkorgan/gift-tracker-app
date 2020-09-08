import faunadb from 'faunadb'
const q = faunadb.query

export const getIdentityProfileId = () =>
  q.Select(
    ['data', 0],
    q.Paginate(q.Match(q.Index('user_profileId'), q.Identity()))
  )
