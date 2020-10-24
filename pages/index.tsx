import React from 'react'
import Layout from '../components/Layout'
import Home from '../features/Home/Home'
import { useSession } from '../lib/user'

const Page = (props) => {
  const { userSession } = useSession()

  return (
    <Layout>
      {!userSession && (
        <div className="flex flex-col">
          <p className="font-bold text-lg">Welcome to Gift Tracker!</p>
          <p>Please login or sign up to continue.</p>
        </div>
      )}
      {userSession && <Home />}
    </Layout>
  )
}

export default Page
