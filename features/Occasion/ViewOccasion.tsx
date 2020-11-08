import Head from 'next/head'
import Link from 'next/link'
import React, { Fragment } from 'react'
import Button from '../../components/Button'
import Heading from '../../components/Heading'
import InputField from '../../components/InputField'
import Section from '../../components/Section'
import {
  useGiftsByOccasion,
  useOccasion,
  useParticipantsByOccasion,
  useReceivedInvitations,
  useUserProfile,
} from '../../lib/hooks'
import { Participant, UserProfile } from '../../lib/types/domain-types'
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
  const participants = useParticipantsByOccasion(id)

  const [userToInvite, setUserToInvite] = React.useState('')

  const userIsOrganizer = session?.userProfile.id === occasion.data?.organizer

  const renderOrganizerLink = (p: UserProfile) => {
    if (!p) return null
    return (
      <li>
        <Link key={p.id} href={`/occasions/${id}/user/${p.id}`}>
          <a>{p.userName || p.id} (Organizer)</a>
        </Link>
      </li>
    )
  }

  const renderParticipantLink = (p: Participant) => {
    if (!p) return null
    return (
      <li>
        <Link key={p.id} href={`/occasions/${id}/user/${p.profileId}`}>
          <a>{p.nickname || p.profileId}</a>
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
        <p className="text-gray-600">Organized by {organizer.data?.userName}</p>
        <p>{occasion.data?.description}</p>
        <Heading>Participants</Heading>
        <div>
          Click on someone to view their Wishlist and other gift suggestions!
        </div>
        <ul className="list-disc pl-8" style={{ listStyle: 'revert' }}>
          {renderOrganizerLink(organizer.data)}
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
              console.log(`Inviting user with profile:`, userProfileToInvite)
              await getApi().createInvitation(
                occasion.data.id,
                userProfileToInvite.id
              )
            }}
          >
            Invite
          </Button>
        </Section>
      )}
    </div>
  )
}

export default ViewOccasion
