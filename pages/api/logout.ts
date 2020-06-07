import auth0 from '../../utils/auth0'

export default async function logout(req, res) {
  try {
    // TODO: delete fauna user keys
    await auth0.handleLogout(req, res)
  } catch (error) {
    console.error(error)
    res.status(error.status || 400).end(error.message)
  }
}
