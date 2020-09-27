import React from 'react'

import withAuth from '../components/with-auth'
import Layout from '../components/layout'
import { createFaunaUserAPI } from '../lib/api/user-api'

// View own profile
// Edit own profile

const Profile = (props) => {
  const [error, setError] = React.useState(null)
  const [appUser, setAppUser] = React.useState(null as any)
  const [appProfile, setAppProfile] = React.useState(null as any)
  const [occasions, setOccasions] = React.useState([])

  const api = React.useMemo(() => {
    return createFaunaUserAPI(props.user.fauna_token)
  }, [props.user.fauna_token])

  const fetchOccasions = React.useCallback(async () => {
    if (appUser?.profileId) {
      setOccasions(await api.getOccasionsByOrganizer(appUser.profileId))
    }
  }, [api, appUser])

  React.useEffect(() => {
    ;(async () => {
      const appUser = await api.getUserByEmail(props.user.email)
      const appProfile = await api.getUserProfileById(appUser.profileId)
      const occasions = await api.getOccasionsByOrganizer(appUser.profileId)
      setAppUser(appUser)
      setAppProfile(appProfile)
      setOccasions(occasions)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Layout user={props.user}>
      {/* {error && (
        <section style={{ color: 'red', margin: 10, border: '1px solid red' }}>
          <pre>
            {JSON.stringify(
              {
                name: error.name,
                message: error.message,
                description: error.description,
              },
              undefined,
              2
            )}
          </pre>
        </section>
      )} */}
      <section>
        <h2>Occasion stuff</h2>
        <button
          onClick={async () => {
            try {
              await api.createOccasion({
                title: 'my great occasion',
                description: 'wow',
                allowSignups: true,
              })
              await fetchOccasions()
            } catch (err) {
              console.error(err)
              setError(err)
            }
          }}
        >
          Create Occasion
        </button>
        <strong>Your Occasions</strong>
        {occasions.map((occasion) => {
          return (
            <div style={{ border: '1px solid grey', margin: 10, padding: 10 }}>
              <pre>{JSON.stringify(occasion, undefined, 2)}</pre>
            </div>
          )
        })}
        <button onClick={() => fetchOccasions()}>Refresh Occasions List</button>
        <button
          onClick={async () => {
            try {
              await api.deleteOccasion(occasions[0].id)
              await fetchOccasions()
            } catch (err) {
              console.error(err)
              setError(err)
            }
          }}
        >
          Delete Occasion
        </button>
      </section>
      <div style={{ height: 50 }} />
      <div>
        <strong>Authentication data</strong>
        <pre>{JSON.stringify(props.user, undefined, 2)}</pre>
      </div>
      <div>
        <strong>Component state</strong>
        <pre>
          {JSON.stringify({ appUser, appProfile, occasions }, undefined, 2)}
        </pre>
      </div>
    </Layout>
  )
}

export default withAuth(Profile)
