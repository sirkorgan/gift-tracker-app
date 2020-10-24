import React from 'react'
import Button from '../../components/Button'
import Heading from '../../components/Heading'
import { useOccasionsByOrganizerQuery } from '../../lib/hooks'
import { useSession } from '../../lib/user'

export default function Home(props) {
  const { userApi, userProfile } = useSession()

  const occasionsQuery = useOccasionsByOrganizerQuery(userProfile?.id)

  return (
    <div>
      <section className="flex flex-col space-y-1">
        <Heading>Your Occasions</Heading>
        <Button
          onClick={async () => {
            try {
              // TODO: convert to mutation
              await userApi.createOccasion({
                title: 'my great occasion',
                description: 'wow',
                allowSignups: true,
              })
              occasionsQuery.refetch()
            } catch (err) {
              console.error(err)
            }
          }}
        >
          Create Occasion
        </Button>
        {occasionsQuery.data?.map((occasion) => {
          return (
            <div
              key={occasion.id}
              style={{ border: '1px solid grey', margin: 10, padding: 10 }}
            >
              <pre>{JSON.stringify(occasion, undefined, 2)}</pre>
            </div>
          )
        })}
        <Button onClick={() => occasionsQuery.refetch()}>
          Refresh Occasions List
        </Button>
        <Button
          onClick={async () => {
            try {
              if (occasionsQuery.data) {
                // TODO: convert to mutation
                await userApi.deleteOccasion(occasionsQuery.data?.[0].id)
                occasionsQuery.refetch()
              }
            } catch (err) {
              console.error(err)
            }
          }}
          disabled={!(occasionsQuery.data?.length > 0)}
        >
          Delete Occasion
        </Button>
      </section>
      {/* <div>
        <strong>Authentication data</strong>
        <pre>{JSON.stringify(user, undefined, 2)}</pre>
      </div>
      <div>
        <strong>Component state</strong>
        <pre>
          {JSON.stringify({ appUser, appProfile, occasions }, undefined, 2)}
        </pre>
      </div> */}
    </div>
  )
}
