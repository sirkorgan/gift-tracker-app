import React from 'react'
import Button from '../../components/Button'
import Heading from '../../components/Heading'
import InputField from '../../components/InputField'
import Section from '../../components/Section'
import {
  useClaimsByOccasion,
  useGiftsByOccasion,
  useOccasion,
  useUserProfile,
  useUserProfilesByOccasion,
} from '../../lib/hooks'
import { IUserAPI } from '../../lib/types/api-types'
import { Gift } from '../../lib/types/domain-types'
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

function CreateGiftForm(props: {
  occasionId: string
  suggestedFor: string
  onSubmit: Function
}) {
  const { occasionId, suggestedFor, onSubmit } = props
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  return (
    <div className="flex flex-col space-y-2">
      <InputField
        id="giftName"
        label="Gift Title"
        onChange={(value) => setName(value)}
      />
      <InputField
        id="giftDescription"
        label="Gift Description"
        onChange={(value) => setDescription(value)}
      />
      <Button
        onClick={() => {
          onSubmit({ name, description, occasionId, suggestedFor })
        }}
        disabled={!name.trim()}
      >
        Create Gift Suggestion
      </Button>
    </div>
  )
}

function ViewWishlist(props: { id: string; profileId: string }) {
  const { id, profileId } = props
  const session = useUserSessionContext()
  const occasion = useOccasion(id)
  const allGifts = useGiftsByOccasion(id)
  const userProfile = useUserProfile(profileId)
  const organizer = useUserProfile(occasion.data?.organizer)
  const participants = useUserProfilesByOccasion(id)
  const allClaims = useClaimsByOccasion(id)

  const ownGifts = React.useMemo(() => {
    if (!allGifts.data) return []
    return allGifts.data.filter((g) => {
      return (
        g.occasionId === id &&
        g.suggestedFor === profileId &&
        g.suggestedBy === profileId
      )
    })
  }, [allGifts.data, id, profileId])

  const otherGifts = React.useMemo(() => {
    if (!allGifts.data) return []
    return allGifts.data.filter((g) => {
      return (
        g.occasionId === id &&
        g.suggestedFor === profileId &&
        g.suggestedBy !== profileId
      )
    })
  }, [allGifts.data, id, profileId])

  const onSubmitCreateGift = async (
    params: Parameters<IUserAPI['createGift']>[0]
  ) => {
    await getApi().createGift(params)
    await allGifts.refetch()
  }

  if (!userProfile.data || !session.userProfile) {
    return null
  }

  const getUserName = (profileId) =>
    organizer.data?.id === profileId
      ? organizer.data.name
      : participants.data?.find((p) => p.id === profileId)?.name

  const isListForCurrentUser = profileId === session.userProfile.id

  function renderGiftListItem(props: { gift: Gift }) {
    const { gift } = props
    const isGiftClaimed = allClaims.data?.find((c) => c.giftId === gift.id)
    const isGiftClaimedByCurrentUser =
      allClaims.data?.find((c) => c.giftId === gift.id)?.claimedBy ===
      session.userProfile.id
    const suggestedByCurrentUser = gift.suggestedBy === session.userProfile.id
    return (
      <Section key={gift.id}>
        <div className=" flex justify-between">
          <strong>{gift.name}</strong>
          <span className="text-gray-600">
            suggested by {getUserName(gift.suggestedBy)}
          </span>
        </div>
        <div>{gift.description}</div>
        <div className="flex">
          <div className="flex justify-start space-x-2 flex-grow">
            {!isListForCurrentUser && (
              <React.Fragment>
                <Button
                  disabled={
                    isListForCurrentUser ||
                    isGiftClaimed ||
                    allClaims.status !== 'success'
                  }
                  onClick={async () => {
                    try {
                      await getApi().claimGift({ giftId: gift.id })
                      // TODO: show feedback that gift is claimed
                    } catch (err) {
                      // TODO: show dialog saying that gift could not be claimed
                      console.error(err)
                    } finally {
                      await allClaims.refetch()
                    }
                  }}
                >
                  {isGiftClaimedByCurrentUser
                    ? 'Claimed by you!'
                    : isGiftClaimed && 'Claimed'}
                  {!isGiftClaimed && 'Claim Gift'}
                </Button>
                {isGiftClaimedByCurrentUser && (
                  <Button
                    onClick={async () => {
                      try {
                        await getApi().deleteClaim(
                          allClaims.data?.find((g) => g.giftId === gift.id)?.id
                        )
                      } catch (err) {
                        console.error(err)
                      } finally {
                        await allClaims.refetch()
                      }
                    }}
                  >
                    Release Claim
                  </Button>
                )}
              </React.Fragment>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            {suggestedByCurrentUser && (
              <Button
                onClick={async () => {
                  await getApi().deleteGift(gift.id)
                  await allGifts.refetch()
                }}
              >
                Delete Gift
              </Button>
            )}
          </div>
        </div>
      </Section>
    )
  }

  return (
    <div className="space-y-2 ">
      <Section>
        {!isListForCurrentUser && (
          <Heading>Suggest a Gift for {userProfile.data.name}</Heading>
        )}
        {isListForCurrentUser && <Heading>Suggest a gift for yourself</Heading>}
        <CreateGiftForm
          occasionId={id}
          suggestedFor={profileId}
          onSubmit={onSubmitCreateGift}
        />
      </Section>
      <Section className="bg-gray-100">
        <Heading>
          {userProfile.data?.name}'s wishlist for {occasion.data?.title}
        </Heading>
        {ownGifts.length > 0 &&
          ownGifts.map((gift) => renderGiftListItem({ gift }))}
        {ownGifts.length === 0 && <p>There are no gifts yet.</p>}
      </Section>
      <Section className="bg-gray-100">
        <Heading>
          Other gift suggestions for{' '}
          {isListForCurrentUser ? 'you' : userProfile.data?.name}
        </Heading>
        {otherGifts.length > 0 &&
          otherGifts.map((gift) => renderGiftListItem({ gift }))}
        {otherGifts.length === 0 && !isListForCurrentUser && (
          <p>There are no gifts yet.</p>
        )}
        {otherGifts.length === 0 && isListForCurrentUser && (
          <p>
            It's a surprise! You can only see gift suggestions for other people.
          </p>
        )}
      </Section>
    </div>
  )
}

export default ViewWishlist
