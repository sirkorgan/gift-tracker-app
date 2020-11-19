import { NextApiRequest, NextApiResponse } from 'next'
import { createFaunaAdminAPI } from '../../lib/api/admin-api'
import getAuth0 from '../../lib/auth0/auth0'

import { initAuth0 } from '@auth0/nextjs-auth0'

export default async function logout(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const auth0 = getAuth0(req) as ReturnType<typeof initAuth0>

    const session = await auth0.getSession(req)
    const email = session.user.email
    const adminApi = createFaunaAdminAPI(process.env.FAUNA_SERVER_KEY)
    await adminApi.logoutUser(email)

    await auth0.handleLogout(req, res)
  } catch (error) {
    console.error(error)
    res.status(error.status || 400).end(error.message)
  }
}
