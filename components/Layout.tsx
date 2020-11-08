import React from 'react'
import Head from 'next/head'

import Header from './Header'
import { useUserSessionContext } from '../lib/user'
import RedirectToLogin from './RedirectToLogin'

const Layout = ({ requireAuth = false, children }) => {
  const session = useUserSessionContext()

  if (requireAuth && !session.userProfile) {
    return <RedirectToLogin />
  }

  return (
    <React.Fragment>
      <Head>
        <title>Gift Tracker</title>
      </Head>
      <div className="container mx-auto px-2 pb-8">
        <Header />
        <main className="p-2">{children}</main>
      </div>
    </React.Fragment>
  )
}

export default Layout
