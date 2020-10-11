import { NextApiRequest, NextApiResponse } from 'next'
import { InvitationRequestBody } from '../../lib/types/api-types'

export default async function handleInvitation(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.statusCode = 501
  res.send('not implemented')
}
