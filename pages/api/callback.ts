import faunadb from 'faunadb'
import auth0 from '../../lib/auth0/auth0'
import { createAdminAPI } from '../../lib/api/fauna-api'
import { User, UserProfile } from '../../lib/types/domain-types'

// After the transaction is completed Auth0 will redirect the user back to your
// application. This is why the callback route (/pages/api/callback.js) needs to
// be created which will create a session cookie:

export default async function callback(req, res) {
  try {
    await auth0.handleCallback(req, res, {
      redirectTo: '/',
      onUserLoaded: async (req, res, session, state) => {
        // TODO: all references to q should be moved into AdminAPI
        const q = faunadb.query
        const client = new faunadb.Client({
          secret: process.env.FAUNA_SERVER_KEY,
        })

        async function removeUserTokens(user: User) {
          // Remove all existing tokens for this user, effectively logging this
          // user out of faunadb if they have ever previously logged in via this
          // callback.

          // TODO: do this in one query with q.Lambda()
          const tokensIssued = await client.paginate(
            q.Match(q.Index('tokens_issued_by_email'), user.email)
          )
          await tokensIssued.each(async (page: any[]) => {
            for (const tokenIssuedRef of page) {
              // delete each token
              const issued: any = await client.query(q.Get(tokenIssuedRef))
              await client.query(q.Delete(issued.data.token))
              await client.query(q.Delete(tokenIssuedRef))
            }
          })
        }

        const adminApi = createAdminAPI(process.env.FAUNA_SERVER_KEY)

        ///////////////////////////////////////////////////////////////////////

        const email = session.user.email

        // Query for user in faunadb.
        let user: User, profile: UserProfile
        try {
          user = await adminApi.getUserByEmail(email)
          profile = await adminApi.getUserProfileById(user.profileId)
        } catch (error) {
          if (error.requestResult?.statusCode === 404) {
            // If user does not exist, create it.
            const result = await adminApi.createUserAndProfile(email)
            user = result.user
            profile = result.profile
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
          await removeUserTokens(user)

          // Create a token for this user. This token will be saved in the auth0
          // session so that it is available to the frontend app to query
          // faunadb directly.
          token = await client.query(
            q.Create(q.Tokens(), {
              instance: q.Ref(q.Collection('users'), user.id),
            })
          )

          // Save the token in tokens_issued collection so that it can be
          // removed later.
          await client.query(
            q.Create(q.Collection('tokens_issued'), {
              data: {
                email,
                token: token.ref,
              },
            })
          )
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
