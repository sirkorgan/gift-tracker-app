import React from 'react'
import withAuth from '../components/withAuth'
import Layout from '../components/Layout'
import Profile from '../features/Profile/Profile'

const Page = (props) => {
  return (
    <Layout>
      <Profile />
    </Layout>
  )
}

export default withAuth(Page)
