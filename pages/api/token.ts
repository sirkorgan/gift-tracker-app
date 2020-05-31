// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// For typescript support: https://nextjs.org/docs/basic-features/typescript#api-routes
import { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
}

export default (req: NextApiRequest, res: NextApiResponse<Data>) => {
  res.status(200).json({ name: 'John Doe' })
}
