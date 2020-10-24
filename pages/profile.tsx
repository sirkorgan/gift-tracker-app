import React from 'react'
import Layout from '../components/Layout'
import Profile from '../features/Profile/Profile'

const Page = (props) => {
  return (
    <Layout requireAuth>
      <Profile />
    </Layout>
  )
}

export default Page
