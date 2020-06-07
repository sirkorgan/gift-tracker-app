import Router from 'next/router'
import React, { Component } from 'react'

import createLoginUrl from '../utils/url-helper'
import Layout from './layout'

export default class RedirectToLogin extends Component {
  componentDidMount() {
    window.location.assign(createLoginUrl(Router.pathname))
  }

  render() {
    return (
      <Layout>
        <div>Signing you in...</div>
      </Layout>
    )
  }
}
