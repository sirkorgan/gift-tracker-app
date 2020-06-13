import faunadb from 'faunadb'
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from 'unique-names-generator'

import auth0 from '../../lib/auth0/auth0'

interface FaunaRef {
  value: {
    id: string
  }
}

interface FaunaUser {
  ref?: FaunaRef
  data: {
    email: string
    profileRef?: FaunaRef
  }
}

interface FaunaUserProfile {
  ref?: FaunaRef
  data: {
    userid: string
    name: string
    hashcode: number
    username: string
  }
}

const generateUserProfileName = () => {
  const randomName: string = uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    length: 2,
    separator: '',
    style: 'capital',
  })
  return randomName
}

const generateUserProfileHashCode = () =>
  Math.floor(1000 + Math.random() * 9000)

const makeUsername = (name, hashcode) => name + '#' + hashcode

const getIdFromRef = (ref: FaunaRef) => ref.value.id

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

        const getUserByEmail = async (email) => {
          return client.query<FaunaUser>(
            // Get will throw if nothing is found.
            q.Get(q.Match(q.Index('users_by_email'), email))
          )
        }

        const getProfileByRef = async (ref) => {
          return client.query<FaunaUserProfile>(
            // Get will throw if nothing is found.
            q.Get(ref)
          )
        }

        const profileExists = async (name, hashcode) => {
          const username = makeUsername(name, hashcode)
          try {
            // console.log(`checking if profile username is in use:`, username)
            await client.query<FaunaUserProfile>(
              // Get will throw if nothing is found.
              q.Get(q.Match(q.Index('profiles_by_username'), username))
            )
            return true
          } catch (error) {
            // console.log(`profile username ${username} is available`)
            return false
          }
        }

        const createUserAndProfile = async (email) => {
          const newUser: FaunaUser = { data: { email } }
          let user = await client.query<FaunaUser>(
            q.Create(q.Collection('users'), newUser)
          )
          // console.log('created user:', JSON.stringify(user, undefined, 2))

          // Also generate a unique public profile for the new user.
          const name = generateUserProfileName()
          let hashcode = generateUserProfileHashCode()
          while (await profileExists(name, hashcode)) {
            hashcode = generateUserProfileHashCode()
          }

          let username = makeUsername(name, hashcode)

          // console.log('user.ref value', user.ref.value)

          const newProfile: FaunaUserProfile = {
            data: {
              userid: getIdFromRef(user.ref),
              name,
              hashcode,
              username,
            },
          }

          let profile = await client.query<FaunaUserProfile>(
            q.Create(q.Collection('profiles'), newProfile)
          )

          // console.log(
          //   'created user profile:',
          //   JSON.stringify(profile, undefined, 2)
          // )

          // update fauna user to keep track of profile
          await client.query(
            q.Update(user.ref, {
              data: { profileRef: profile.ref },
            })
          )

          return { user, profile }
        }

        ///////////////////////////////////////////////////////////////////////

        const email = session.user.email

        // Query for user in faunadb.
        let user: FaunaUser, profile: FaunaUserProfile
        try {
          user = await getUserByEmail(email)
          profile = await getProfileByRef(user.data.profileRef)
        } catch (error) {
          if (error.requestResult?.statusCode === 404) {
            // If user does not exist, create it.
            const result = await createUserAndProfile(email)
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
