import { initAuth0 } from '@auth0/nextjs-auth0'

let auth0
export default function getAuth0(req = undefined) {
  if (!auth0) {
    let config

    if (typeof window === 'undefined') {
      /**
       * Settings exposed to the server.
       */
      config = {
        AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
        AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
        AUTH0_SCOPE: process.env.AUTH0_SCOPE,
        AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
        API_AUDIENCE: process.env.API_AUDIENCE,
        API_BASE_URL: process.env.API_BASE_URL,
        // REDIRECT_URI: process.env.REDIRECT_URI,
        // POST_LOGOUT_REDIRECT_URI: process.env.POST_LOGOUT_REDIRECT_URI,
        SESSION_COOKIE_SECRET: process.env.SESSION_COOKIE_SECRET,
        SESSION_COOKIE_LIFETIME: process.env.SESSION_COOKIE_LIFETIME,
      }
    } else {
      /**
       * Settings exposed to the client.
       */
      config = {
        AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
        AUTH0_SCOPE: process.env.AUTH0_SCOPE,
        AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
        // REDIRECT_URI: process.env.REDIRECT_URI,
        POST_LOGOUT_REDIRECT_URI: process.env.POST_LOGOUT_REDIRECT_URI,
      }
    }

    let host, proto
    if (typeof window !== 'undefined') {
      // configure REDIRECT_URI and POST_LOGOUT_REDIRECT_URI based on window.location
      proto = window.location.protocol
      host = window.location.host
    } else if (req) {
      // configure REDIRECT_URI and POST_LOGOUT_REDIRECT_URI based on request host
      host = req.headers.host
      proto = host.startsWith('localhost') ? 'http' : 'https'
    } else {
      console.error(`Can't initialize auth0 - fix me`)
    }
    config.REDIRECT_URI = `${proto}://${host}/api/callback`
    config.POST_LOGOUT_REDIRECT_URI = `${proto}://${host}/`
    console.log('REDIRECT_URI = ' + config.REDIRECT_URI)

    auth0 = initAuth0({
      domain: config.AUTH0_DOMAIN,
      clientId: config.AUTH0_CLIENT_ID,
      clientSecret: config.AUTH0_CLIENT_SECRET,
      scope: config.AUTH0_SCOPE,
      redirectUri: config.REDIRECT_URI,
      postLogoutRedirectUri: config.POST_LOGOUT_REDIRECT_URI,
      session: {
        // The secret used to encrypt the cookie.
        cookieSecret: config.SESSION_COOKIE_SECRET,
        // The cookie lifetime (expiration) in seconds. Set to 8 hours by default.
        cookieLifetime: 60 * 60 * 8,
        // (Optional) The cookie domain this should run on. Leave it blank to restrict it to your domain.
        cookieDomain: '',
        // (Optional) SameSite configuration for the session cookie. Defaults to 'lax', but can be changed to 'strict' or 'none'. Set it to false if you want to disable the SameSite setting.
        cookieSameSite: 'lax',
        // (Optional) Store the id_token in the session. Defaults to false.
        storeIdToken: false,
        // (Optional) Store the access_token in the session. Defaults to false.
        storeAccessToken: true, // https://github.com/auth0/nextjs-auth0#calling-an-api
        // (Optional) Store the refresh_token in the session. Defaults to false.
        storeRefreshToken: false,
      },
      oidcClient: {
        // (Optional) Configure the timeout in milliseconds for HTTP requests to Auth0.
        httpTimeout: 2500,
        // (Optional) Configure the clock tolerance in milliseconds, if the time on your server is running behind.
        clockTolerance: 10000,
      },
    })
  }
  return auth0
}
