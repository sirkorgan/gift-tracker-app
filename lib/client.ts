// This file contains FaunaDB queries
import faunadb from 'faunadb'
import { UserProfile } from './types'

const q = faunadb.query

export function createClient(secret: string) {
  const client = new faunadb.Client({ secret })
  return {}
}
