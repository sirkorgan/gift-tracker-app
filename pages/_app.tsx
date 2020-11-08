// import App from "next/app";
import React from 'react'
import type { AppProps, AppContext } from 'next/app'
import App from 'next/app'
import { ReactQueryCacheProvider, QueryCache } from 'react-query'
import { Hydrate, dehydrate } from 'react-query/hydration'

import { getPrefetchCache, UserSessionProvider } from '../lib/user'

import '../css/tailwind.css'
import getAuth0 from '../lib/auth0/auth0'

const queryCache = new QueryCache()

function GiftTrackerApp({ Component, pageProps }: AppProps) {
  const { user, dehydratedState } = pageProps
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      <Hydrate state={dehydratedState}>
        <UserSessionProvider initialUser={user}>
          <Component {...pageProps} />
        </UserSessionProvider>
      </Hydrate>
    </ReactQueryCacheProvider>
  )
}

// Only uncomment this method if you have blocking data requirements for
// every single page in your application. This disables the ability to
// perform automatic static optimization, causing every page in your app to
// be server-side rendered.

GiftTrackerApp.getInitialProps = async (appContext: AppContext) => {
  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext)

  const ctx = appContext.ctx
  if (ctx.req) {
    const auth0 = getAuth0(ctx.req)
    const session = await auth0.getSession(ctx.req)
    // if the user exists in the session, include it in the app props so that the
    // client doesn't need to check it
    try {
      if (session?.user) {
        const prefetchCache = await getPrefetchCache(ctx)
        appProps.pageProps.user = session.user
        appProps.pageProps.dehydratedState = dehydrate(prefetchCache)
      }
    } catch {
      // DB was cleaned or user data is otherwise not there
    }
  }

  return { ...appProps }
}

export default GiftTrackerApp
