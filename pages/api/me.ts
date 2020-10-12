import { NextApiRequest, NextApiResponse } from 'next'
import getAuth0 from '../../lib/auth0/auth0'

export default async function me(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth0 = getAuth0()
    await auth0.handleProfile(req, res, { refetch: true })
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).end(error.message)
  }
}
