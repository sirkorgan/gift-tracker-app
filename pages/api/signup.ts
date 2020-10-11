import { NextApiRequest, NextApiResponse } from 'next'
import { SignupRequestBody } from '../../lib/types/api-types'

export default async function handleSignupRequest(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.statusCode = 501
  res.send('not implemented')
}
