import React from 'react'
import Layout from '../components/layout'
import { useFetchUser } from '../lib/auth0/user'

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
      </div>
    </Layout>
  )
}

export default Index
