import axios from 'axios'
import Link from 'next/link'
import React from 'react'
import Button from '../../components/Button'
import Heading from '../../components/Heading'
import InputField from '../../components/InputField'
import Section from '../../components/Section'
import {
  useOccasionsByParticipant,
  useOwnOccasions,
  useReceivedInvitations,
} from '../../lib/hooks'
import { useUserSessionContext } from '../../lib/user'

function ReceivedInvitationsList(props) {
  const sessionContext = useUserSessionContext()
  const receivedInvitations = useReceivedInvitations()
  const handleInvitation = (invitationId, action) => {
    axios.post('/api/invitation', {
      email: sessionContext.userSession.email,
      secret: sessionContext.userSession.fauna_token,
      invitationId,
      action,
    })
  }
  return (
    <React.Fragment>
      {receivedInvitations.data?.length > 0 &&
        receivedInvitations.data
          .filter((inv) => inv.status === 'pending')
          .map((inv) => {
            return (
              <Section key={inv.id} className="border-purple-600 bg-purple-100">
                <p>
                  <strong>{inv.sender}</strong> invited you to join the occasion{' '}
                  <strong>{inv.occasionId}</strong>
                </p>
                <Button
                  onClick={() => {
                    handleInvitation(inv.id, 'accept')
                  }}
                >
                  Accept Invitation
                </Button>
                <Button>Ignore Invitation</Button>
              </Section>
            )
          })}
    </React.Fragment>
  )
}

function OccasionList(props) {
  const { userProfile } = useUserSessionContext()
  const ownOccasions = useOwnOccasions(userProfile?.id)
  const participatingOccasions = useOccasionsByParticipant(userProfile?.id)

  return (
    <Section>
      <Heading>Your Occasions</Heading>
      {ownOccasions.data?.length > 0 && (
        <React.Fragment>
          <p>This is a list of occasions that you are organizing.</p>

          <Section>
            <ul className="pl-5">
              {ownOccasions.data?.map((occasion) => {
                const href = `/occasions/${occasion.id}`
                return (
                  <li key={href}>
                    <Link href={href}>
                      <a className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600">
                        {occasion.title}
                      </a>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Section>
        </React.Fragment>
      )}
      {participatingOccasions.data?.length > 0 && (
        <React.Fragment>
          <p>This is a list of occasions that you are participating in.</p>
          <ul className="pl-5">
            {participatingOccasions.data?.map((occasion) => {
              const href = `/occasions/${occasion.id}`
              return (
                <li key={href}>
                  <Link href={href}>
                    <a className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600">
                      {occasion.title}
                    </a>
                  </Link>
                </li>
              )
            })}
          </ul>
        </React.Fragment>
      )}
      {!ownOccasions.data?.length && !participatingOccasions.data?.length && (
        <div>You are not currently participating in any occasions.</div>
      )}
    </Section>
  )
}

function CreateOccasionForm(props) {
  const { userApi, userProfile } = useUserSessionContext()
  const occasionsQuery = useOwnOccasions(userProfile?.id)

  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')

  const [result, setResult] = React.useState('')

  return (
    <Section>
      <Heading>Create New Occasion</Heading>
      <p>
        To create a new occasion, fill in the form and click the Create Occasion
        button.
      </p>
      <InputField
        id="title"
        label="Title"
        onChange={(value) => setTitle(value)}
      />
      <InputField
        id="description"
        label="Description"
        onChange={(value) => setDescription(value)}
      />
      <Button
        disabled={!title.trim() || !description.trim()}
        onClick={async () => {
          try {
            // TODO: convert to mutation
            await userApi.createOccasion({
              title: title.trim(),
              description: description.trim(),
              allowSignups: false,
            })
            occasionsQuery.refetch()
            setResult('Success!')
          } catch (err) {
            console.error(err)
            setResult(err.message)
          }
        }}
      >
        Create Occasion
      </Button>
      {result && <div>{result}</div>}
    </Section>
  )
}

export default function Home(props) {
  return (
    <div className="space-y-2">
      <ReceivedInvitationsList />
      <OccasionList />
      <CreateOccasionForm />
    </div>
  )
}
