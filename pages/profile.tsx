import React from 'react'

import withAuth from '../components/with-auth'
import Layout from '../components/layout'
import { createUserAPI } from '../lib/api/user-api'

const Profile = (props) => {
  const [state, setState] = React.useState({})

  const api = React.useMemo(() => {
    return createUserAPI(props.user.fauna_token)
  }, [props.user.fauna_token])

  React.useEffect(() => {
    ;(async () => {
      const appUser = await api.getUserByEmail(props.user.email)
      const appProfile = await api.getUserProfileById(appUser.profileId)
      setState({
        appUser,
        appProfile,
      })
    })()
  }, [api, props.user.email])

  return (
    <Layout user={props.user}>
      <pre>{JSON.stringify(props.user, undefined, 2)}</pre>
      <pre>{JSON.stringify(state, undefined, 2)}</pre>
      <a href="/api/logout">Logout</a>
    </Layout>
  )
}

export default withAuth(Profile)
