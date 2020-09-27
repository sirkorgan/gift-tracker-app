import { NextApiRequest, NextApiResponse } from 'next'

export default async function changeName(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // user will POST to this with their secret, email address and new name.
  // this function will create an admin API, verify the secret and then make the change.
  // TODO:
}
