import { NextApiRequest, NextApiResponse } from 'next'
import { createFaunaAdminAPI } from '../../lib/api/admin-api'
import { InvitationRequestBody } from '../../lib/types/api-types'

export default async function handleInvitation(
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

    const { invitationId, action } = req.body as InvitationRequestBody

    // validate action: "accepted" or "ignored"
    if (['accepted', 'ignored'].includes(action)) {
      res.statusCode = 400
      res.send('Bad action')
      return
    }

    try {
      const invitation = await adminApi.getInvitation(invitationId)
      const occasionId = invitation.occasionId
      const user = await adminApi.getUserByEmail(email)
      await adminApi.addParticipant(user.profileId, occasionId)
    } catch (error) {
      res.statusCode = 500
      res.send(error.message)
      return
    }

    res.statusCode = 200
    res.end()
    return
  }

  res.statusCode = 400
  res.end()
}
