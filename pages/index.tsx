import React from 'react'
import Layout from '../components/Layout'
import Home from '../features/Home/Home'
import { useSession } from '../lib/user'

// Public landing page with login/signup links.
// All other routes require the user to be logged in.
// When the user logsin, they should redirected to the /occasions route.

const Page = (props) => {
  const { userSession } = useSession()

  // TODO: rethink where user is fetched. Try to fetch user only once per session!
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
