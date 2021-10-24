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

interface ShoppingList {
  [userProfileId: string]: {
    claimId: string
    gift: Gift
  }[]
}

function createLookupTable<T extends { id?: string }>(
  list: T[]
): { [id: string]: T } {
  return list.reduce((map: { [id: string]: T }, item) => {
    if (!item.id) {
      console.warn(`createLookupTable: No ID for list item`, item)
    }
    map[item.id] = item
    return map
  }, {})
}

function ViewShoppingList(props: { occasionId: string }) {
  const { occasionId } = props

  const session = useUserSessionContext()
  const profileId = session.userProfile?.id

  const occasion = useOccasion(occasionId)
  const allGifts = useGiftsByOccasion(occasionId)
  // const userProfile = useUserProfile(profileId)
  const organizer = useUserProfile(occasion.data?.organizer)
  const participants = useUserProfilesByOccasion(occasionId)
  const allClaims = useClaimsByOccasion(occasionId)

  const shoppingListAllUsers: ShoppingList = React.useMemo(() => {
    if (allClaims.data && allGifts.data) {
      const giftsMap = createLookupTable(allGifts.data)

      const shoppingList: ShoppingList = {}
      for (const claim of allClaims.data) {
        if (claim.claimedBy === profileId) {
          const claimId = claim.id
          const gift = giftsMap[claim.giftId]

          let listForUser = shoppingList[gift.suggestedFor]
          if (!listForUser) {
            listForUser = []
            shoppingList[gift.suggestedFor] = listForUser
          }

          listForUser.push({ claimId, gift })
        }
      }
      return shoppingList
    } else {
      return {}
    }
  }, [allClaims.data, allGifts.data, profileId])

  const getUserName = (profileId) =>
    organizer.data?.id === profileId
      ? organizer.data.name
      : participants.data?.find((p) => p.id === profileId)?.name

  const renderGiftItem = (gift: Gift) => {
    return (
      <Section key={gift.id} className="bg-red-100 border-red-600">
        <div className=" flex justify-between">
          <strong>{gift.name}</strong>
          <span className="text-gray-600">
            suggested by {getUserName(gift.suggestedBy)}
          </span>
        </div>
        <div
          style={{
            overflowWrap: 'break-word',
          }}
        >
          {gift.description}
        </div>
      </Section>
    )
  }

  // TODO:
  //  - reduce number of db read ops
  //  - add purchase status

  const recipients = Object.keys(shoppingListAllUsers)

  return (
    <Section>
      <Heading>Shopping list for {occasion.data?.title}</Heading>
      <p>
        Below a list of your claimed gift suggestions, organized by recipient.
        More functionality will be added here in the future, including the
        ability to check off items from your shopping list.
      </p>
      <p>Please let me know what else you'd like to see here!</p>
      <div className="space-y-4">
        {recipients.map((recipProfileId) => {
          const shoppingList = shoppingListAllUsers[recipProfileId]
          return (
            <div key={recipProfileId} className="space-y-2">
              <Heading>Shopping list for {getUserName(recipProfileId)}</Heading>
              <div className="space-y-2">
                {shoppingList.map(({ claimId, gift }) => {
                  return renderGiftItem(gift)
                })}
              </div>
            </div>
          )
        })}
        {recipients.length === 0 && (
          <strong>There's nothing here... Claim some gift suggestions!</strong>
        )}
      </div>
    </Section>
  )
}

export default ViewShoppingList
