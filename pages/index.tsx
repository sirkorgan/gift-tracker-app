import React from 'react'
import Layout from '../components/layout'
import { useFetchUser } from '../lib/auth0/user'

// Public landing page with login/signup links.
// All other routes require the user to be logged in.
// When the user logsin, they should redirected to the /occasions route.

const Index = (props) => {
  const { user, loading } = useFetchUser()

  return (
    <Layout user={user} loading={loading}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1 className="text-5xl font-bold text-purple-500">Hello world!</h1>
        <div>Sign up or log in</div>
      </div>
    </Layout>
  )
}

export default Index
