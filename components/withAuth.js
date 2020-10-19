import React, { Component } from 'react'

import getAuth0 from '../lib/auth0/auth0'
import { fetchSession } from '../lib/user'
import createLoginUrl from '../lib/auth0/url-helper'
import RedirectToLogin from './RedirectToLogin'

export default function withAuth(InnerComponent) {
  return class Authenticated extends Component {
    static async getInitialProps(ctx) {
      if (!ctx.req) {
        // client page transition
        const user = await fetchSession()
        return {
          user,
        }
      }

      const auth0 = getAuth0(ctx.req)
      const session = await auth0.getSession(ctx.req)

      if (!session || !session.user) {
        ctx.res.writeHead(302, {
          Location: createLoginUrl(ctx.req.url),
        })
        ctx.res.end()
        return
      }

      return { user: session.user }
    }

    render() {
      if (!this.props.user) {
        return <RedirectToLogin />
      }

      return <InnerComponent {...this.props} user={this.props.user} />
    }
  }
}
