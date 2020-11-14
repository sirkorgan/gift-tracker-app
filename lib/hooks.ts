import { useQuery } from 'react-query'
import { getApi } from './user'

// api fetchers

async function fetchOccasionsByOrganizer(key, profileId) {
  return getApi().getOccasionsByOrganizer(profileId)
}

async function fetchOccasionById(key, id) {
  return getApi().getOccasionById(id)
}

async function fetchOccasionsByParticipant(key, profileId) {
  return getApi().getOccasionsByParticipant(profileId)
}

async function fetchParticipantsByOccasion(key, occasionId) {
  return getApi().getParticipantsForOccasion(occasionId)
}

async function fetchUserProfilesByOccasion(key, occasionId) {
  return getApi().getUserProfilesForOccasion(occasionId)
}

async function fetchGiftsByOccasion(key, occasionId) {
  return getApi().getGiftsForOccasion(occasionId)
}

async function fetchClaimsByOccasion(key, occasionId) {
  return getApi().getClaimsForOccasion(occasionId)
}

async function fetchReceivedInvitations(key) {
  return getApi().getReceivedInvitations()
}

// hooks

export function useUserProfile(profileId) {
  return useQuery(
    ['userProfile', profileId],
    (key, profileId: string) => getApi().getUserProfileById(profileId),
    { enabled: !!profileId }
  )
}

export function useOwnOccasions(profileId) {
  return useQuery(['ownOccasions', profileId], fetchOccasionsByOrganizer, {
    enabled: !!profileId,
  })
}

export function useOccasion(occasionId) {
  return useQuery(['occasion', occasionId], fetchOccasionById, {
    enabled: !!occasionId,
  })
}

export function useOccasionsByParticipant(profileId) {
  return useQuery(
    ['participatingOccasions', profileId],
    fetchOccasionsByParticipant,
    {
      enabled: !!profileId,
    }
  )
}

export function useParticipantsByOccasion(occasionId) {
  return useQuery(
    ['participantsByOccasion', occasionId],
    fetchParticipantsByOccasion,
    {
      enabled: !!occasionId,
    }
  )
}

export function useUserProfilesByOccasion(occasionId) {
  return useQuery(
    ['profilesByOccasion', occasionId],
    fetchUserProfilesByOccasion,
    {
      enabled: !!occasionId,
    }
  )
}

export function useGiftsByOccasion(occasionId) {
  return useQuery(['giftsByOccasion', occasionId], fetchGiftsByOccasion, {
    enabled: !!occasionId,
  })
}

export function useClaimsByOccasion(occasionId) {
  return useQuery(['claimsByOccasion', occasionId], fetchClaimsByOccasion, {
    enabled: !!occasionId,
  })
}

export function useReceivedInvitations() {
  return useQuery(['receivedInvitations'], fetchReceivedInvitations)
}
