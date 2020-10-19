import { useQuery } from 'react-query'
import { getApi } from './user'

// api fetchers

async function fetchOccasionsByOrganizer(key, profileId) {
  return getApi().getOccasionsByOrganizer(profileId)
}

// hooks

export function useOccasionsByOrganizerQuery(profileId) {
  return useQuery(['ownOccasions', profileId], fetchOccasionsByOrganizer, {
    enabled: !!profileId,
  })
}
