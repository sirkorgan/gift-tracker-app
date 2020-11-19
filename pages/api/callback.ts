import { NextApiRequest, NextApiResponse } from 'next'
import getAuth0 from '../../lib/auth0/auth0'
import { createFaunaAdminAPI } from '../../lib/api/admin-api'
import { User, UserProfile } from '../../lib/types/domain-types'

// After the transaction is completed Auth0 will redirect the user back to your
// application. This is why the callback route (/pages/api/callback.js) needs to
// be created which will create a session cookie:

export default async function callback(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const auth0 = getAuth0(req)
    await auth0.handleCallback(req, res, {
      redirectTo: '/',
      onUserLoaded: async (req, res, session, state) => {
        const adminApi = createFaunaAdminAPI(process.env.FAUNA_SERVER_KEY)

        ///////////////////////////////////////////////////////////////////////

        const email = session.user.email

        // Query for user in faunadb.
        let user: User, profile: UserProfile
        let shouldCreateUser = false
        try {
          user = await adminApi.getUserByEmail(email)
          profile = await adminApi.getUserProfileById(user.profileId)
        } catch (err) {
          if (err.requestResult?.statusCode === 404) {
            shouldCreateUser = true
          } else {
            console.error(`Could not get user and/or profile:`, err)
          }
        }

        if (shouldCreateUser) {
          try {
            // If user does not exist, create it.
            const result = await adminApi.createUserAndProfile(email)
            user = result.user
            profile = result.profile
          } catch (err) {
            console.error(err)
          }
        }

        if (!user) {
          throw new Error('User was not created')
        }

        if (!profile) {
          throw new Error('Profile was not created')
        }

        let token
        if (user) {
          // Create a token for this user. This token will be saved in the auth0
          // session so that it is available to the frontend app to query
          // faunadb directly.
          token = await adminApi.loginUser(user.email)
        } else {
          throw new Error(`Could not login fauna user with email: ${email}`)
        }

        return {
          ...session,
          user: {
            ...session.user,
            // Save fauna user token in auth0 session to make it available to
            // the frontend app.
            fauna_token: token?.secret,
          },
        }
      },
    })
  } catch (error) {
    console.error(error)
    res.status(error.status || 400).end(error.message)
  }
}
