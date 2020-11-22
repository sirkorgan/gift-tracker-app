import Link from 'next/link'
import React from 'react'
import Button from '../../components/Button'
import Heading from '../../components/Heading'
import InputField from '../../components/InputField'
import Section from '../../components/Section'
import {
  useOccasion,
  useUserProfile,
  useUserProfilesByOccasion,
} from '../../lib/hooks'
import { UserProfile } from '../../lib/types/domain-types'
import { getApi, useUserSessionContext } from '../../lib/user'

// Occasion not found (if no occasion with that id)

// as organizer:
// View occasion
// Edit occasion
// View signup requests
// Accept signup request
// View particpants
// Send invitation
// View invitations
// Cancel invitation

// as particpant:
// View occasion

// as non-particpant:
// Accept invitation (if user has been invited)
// Signup (if occasion is open to signups)
// Occasion not found (if occasion is not open to signups)

function ViewOccasion(props: { id: string }) {
  const { id } = props
  const session = useUserSessionContext()
  const occasion = useOccasion(id)
  const organizer = useUserProfile(occasion.data?.organizer)
  const participants = useUserProfilesByOccasion(id)
  const [userToInvite, setUserToInvite] = React.useState('')
  const [inviteStatus, setInviteStatus] = React.useState('')

  const userIsOrganizer = session?.userProfile.id === occasion.data?.organizer

  const renderParticipantLink = (p: UserProfile) => {
    if (!p) return null
    return (
      <li key={p.id}>
        <Link href={`/occasions/${id}/user/${p.id}`}>
          <a>
            {p.name || p.id} {p.id === organizer.data?.id && '(Organizer)'}
          </a>
        </Link>
      </li>
    )
  }

  if (!occasion.data) {
    return null
  }

  return (
    <div className="space-y-2 ">
      <Section>
        <Heading>{occasion.data?.title}</Heading>
        <p className="text-gray-600">Organized by {organizer.data?.name}</p>
        <p>{occasion.data?.description}</p>
        <div className="space-x-2">
          <Link href={`/occasions/${id}/user/${session.userProfile.id}`}>
            <Button>View your wishlist</Button>
          </Link>
          <Link href={`/occasions/${id}/shopping-list`}>
            <Button>View your shopping list</Button>
          </Link>
        </div>
        <Heading>Participants</Heading>
        <p>
          Click on a name in the list below to view their wishlist and offer
          gift suggestions!
        </p>
        <ul className="list-disc pl-8" style={{ listStyle: 'revert' }}>
          {renderParticipantLink(organizer.data)}
          {participants.status === 'success' &&
            participants.data.map(renderParticipantLink)}
        </ul>
      </Section>
      {userIsOrganizer && (
        <Section>
          <Heading>Invite someone else to join this occasion</Heading>
          <p>
            Enter their name in the field below and click on the Invite button!
          </p>
          <InputField
            id="inviteUser"
            label="Username (ex. SecretSanta#1234)"
            value={userToInvite}
            onChange={(value) => {
              setUserToInvite(value)
            }}
          />
          <Button
            onClick={async () => {
              // resolve username to profileid
              const userProfileToInvite = await getApi().getUserProfileByUserName(
                userToInvite
              )
              try {
                await getApi().createInvitation(
                  occasion.data.id,
                  userProfileToInvite.id
                )
                setInviteStatus(`Successfully invited ${userToInvite}`)
              } catch (err) {
                setInviteStatus(`Failed to invite ${userToInvite}`)
              }
            }}
          >
            Invite
          </Button>
          <div>{inviteStatus}</div>
        </Section>
      )}
    </div>
  )
}

export default ViewOccasion
