import { NextApiRequest, NextApiResponse } from 'next'
import { createFaunaAdminAPI } from '../../lib/api/admin-api'
import { ChangeNameRequestBody } from '../../lib/types/api-types'

export default async function handleNameChange(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { secret, email } = req.body
    const adminApi = createFaunaAdminAPI(process.env.FAUNA_SERVER_KEY)
    let didAuth = false
    try {
      didAuth = await adminApi.verifySecret(email, secret)
    } catch {
      // verification failed for any reason should cause a 403 to avoid leaking information
    }
    if (!didAuth) {
      res.statusCode = 403
      res.end()
      return
    }

    const { name } = req.body as ChangeNameRequestBody

    // validate name: should be only letters and numbers, no spaces or other characters
    const validNameRegex = /^[a-zA-Z0-9]+$/
    if (!(name && validNameRegex.test(name))) {
      res.statusCode = 400
      res.send('Bad name')
      return
    }

    const user = await adminApi.getUserByEmail(email)
    await adminApi.updateUserProfileName(user.profileId, name)
    res.statusCode = 200
    res.end()
    return
  }

  res.statusCode = 400
  res.end()
}
