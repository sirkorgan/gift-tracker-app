import React from 'react'
import auth0 from '../utils/auth0'

import { GetServerSideProps } from 'next'
import withAuth from '../components/with-auth'
import Layout from '../components/layout'
import { useFetchUser } from '../utils/user'

const Profile = (props) => {
  const [state, setState] = React.useState({ session: undefined })

  React.useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/me')
      if (res.ok) {
        setState({
          session: await res.json(),
        })
      }
    })()
  }, [])

  const { user, loading } = useFetchUser()

  return (
    <Layout user={user} loading={loading}>
      <pre>{JSON.stringify(props.user, undefined, 2)}</pre>
      <pre>{JSON.stringify(state, undefined, 2)}</pre>

      <a href="/api/logout">Logout</a>
    </Layout>
  )
}

// Profile.getInitialProps = async ({ req, res }) => {
//   if (typeof window === 'undefined') {
//     const session = await auth0.getSession(req)
//     if (!session || !session.user) {
//       res.writeHead(302, {
//         Location: '/api/login',
//       })
//       res.end()
//       return
//     }
//     return { user: session.user }
//   }
// }

export default withAuth(Profile)
