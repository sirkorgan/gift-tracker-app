import { NextApiRequest, NextApiResponse } from 'next'
import getAuth0 from '../../lib/auth0/auth0'

export default async function logout(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // TODO: delete fauna user keys
    const auth0 = getAuth0(req)
    await auth0.handleLogout(req, res)
  } catch (error) {
    console.error(error)
    res.status(error.status || 400).end(error.message)
  }
}
