import faunadb from 'faunadb'
import auth0 from '../../utils/auth0'

// After the transaction is completed Auth0 will redirect the user back to your
// application. This is why the callback route (/pages/api/callback.js) needs to
// be created which will create a session cookie:

export default async function callback(req, res) {
  try {
    await auth0.handleCallback(req, res, {
      redirectTo: '/',
      onUserLoaded: async (req, res, session, state) => {
        const q = faunadb.query
        const client = new faunadb.Client({
          secret: process.env.FAUNA_SERVER_KEY,
        })

        const email = session.user.email

        // Query for user in faunadb.
        let user
        try {
          user = await client.query(
            // Get will throw if nothing is found.
            q.Get(q.Match(q.Index('users_by_email'), email))
          )
        } catch (error) {
          if (error.requestResult?.statusCode === 404) {
            // If user does not exist, create it.
            user = await client.query(
              q.Create(q.Collection('users'), { data: { email } })
            )
          } else {
            console.error('unknown db error: ', error)
            throw new Error('unknown db error')
          }
        }

        let token
        if (user) {
          // Remove all existing tokens for this user, effectively logging this
          // user out of faunadb if they have ever previously logged in via this
          // callback.
          const tokensIssued = await client.paginate(
            q.Match(q.Index('tokens_issued_by_email'), email)
          )
          // TODO: do this in one query with q.Lambda()
          await tokensIssued.each(async (page: any[]) => {
            for (const tokenIssuedRef of page) {
              // delete each token
              const issued: any = await client.query(q.Get(tokenIssuedRef))
              await client.query(q.Delete(issued.data.token))
              await client.query(q.Delete(tokenIssuedRef))
            }
          })

          // Create a token for this user. This token will be saved in the auth0
          // session so that it is available to the frontend app to query
          // faunadb directly.
          token = await client.query(
            q.Create(q.Tokens(), { instance: user.ref })
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
