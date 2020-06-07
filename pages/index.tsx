import React from 'react'
import Layout from '../components/layout'
import { useFetchUser } from '../utils/user'

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
        Index page
      </div>
    </Layout>
  )
}

export default Index
