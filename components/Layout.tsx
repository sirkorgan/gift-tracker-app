import React from 'react'
import Head from 'next/head'

import Header from './Header'

const Layout = ({ children }) => (
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

export default Layout
