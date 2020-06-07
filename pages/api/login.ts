import auth0 from '../../utils/auth0'

// Note: This route supports providing redirectTo in the querystring, eg:
// (/api/login?redirectTo=/profile). The user will automatically be redirect to
// this URL after signing in.

export default async function login(req, res) {
  try {
    await auth0.handleLogin(req, res)
  } catch (error) {
    console.error(error)
    res.status(error.status || 400).end(error.message)
  }
}
