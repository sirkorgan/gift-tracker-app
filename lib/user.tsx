import React from 'react'
import { QueryCache, useQuery } from 'react-query'
import { createFaunaUserAPI } from './api/user-api'
import getAuth0 from './auth0/auth0'
import { IUserAPI } from './types/api-types'
import { User, UserProfile } from './types/domain-types'

const QUERY_KEY_SESSION = 'session'
const QUERY_KEY_USER = 'user'
const QUERY_KEY_PROFILE = 'profile'

let api: IUserAPI = null

export const initApi = (secret) => {
  if (!secret) {
    return null
  }
  api = createFaunaUserAPI(secret)
  return api
}

export const getApi = () => {
  if (!api) {
    console.error('Tried to use uninitialized API')
  }
  return api
}

type UserSession = {
  nickname: string
  name: string
  picture: string
  updated_at: string
  email: string
  email_verified: boolean
  sub: string
  fauna_token: string
}

interface IUserSessionContext {
  userSession: UserSession
  userApi: IUserAPI
  userAccount: User
  userProfile: UserProfile
  refetch: Function
}

const UserSessionContext = React.createContext<IUserSessionContext>(undefined)

// this will only ever be called from the client
export const fetchSession = async (): Promise<UserSession> => {
  const res = await fetch('/api/me')
  const userSession = res.ok ? await res.json() : null
  return userSession
}

async function fetchUser(key, email) {
  return getApi().getUserByEmail(email)
}

async function fetchUserProfile(key, profileId) {
  return getApi().getUserProfileById(profileId)
}

export const useSession = (initialUser: UserSession = undefined) => {
  return useQuery(
    QUERY_KEY_SESSION,
    fetchSession,
    initialUser ? { initialData: initialUser } : undefined
  )
}

export function useUserQuery(email) {
  return useQuery([QUERY_KEY_USER, email], fetchUser, {
    enabled: !!email,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useProfileQuery(profileId) {
  return useQuery([QUERY_KEY_PROFILE, profileId], fetchUserProfile, {
    enabled: !!profileId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export const UserSessionProvider = ({ initialUser, children }) => {
  const userSessionQuery = useSession(initialUser)
  const appUserQuery = useUserQuery(userSessionQuery.data?.email)
  const appProfileQuery = useProfileQuery(appUserQuery.data?.profileId)

  const refetch = React.useCallback(() => {
    userSessionQuery.refetch()
    appUserQuery.refetch()
    appProfileQuery.refetch()
  }, [appProfileQuery, appUserQuery, userSessionQuery])

  const contextValue = React.useMemo(() => {
    const ctx = {
      userSession: userSessionQuery.data,
      userApi: initApi(userSessionQuery.data?.fauna_token),
      userAccount: appUserQuery.data,
      userProfile: appProfileQuery.data,
      refetch,
    }
    return ctx
  }, [appProfileQuery.data, appUserQuery.data, refetch, userSessionQuery.data])

  return (
    <UserSessionContext.Provider value={contextValue}>
      {children}
    </UserSessionContext.Provider>
  )
}

export const useUserSessionContext = () => React.useContext(UserSessionContext)

export const getPrefetchCache = async (ctx) => {
  const queryCache = new QueryCache()
  const userSession = await queryCache.prefetchQuery(
    QUERY_KEY_SESSION,
    async () => {
      const auth0 = getAuth0(ctx.req)
      const session = await auth0.getSession(ctx.req)
      return session.user
    }
  )
  if (userSession) {
    // need to initialize the api before using the other fetch functions
    initApi(userSession?.fauna_token)
    const userAccount = await queryCache.prefetchQuery(
      [QUERY_KEY_USER, userSession.email],
      fetchUser
    )
    const userProfile = await queryCache.prefetchQuery(
      [QUERY_KEY_PROFILE, userAccount.profileId],
      fetchUserProfile
    )
  }
  return queryCache
}
