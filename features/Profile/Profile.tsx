import React from 'react'
import { useSession } from '../../lib/user'

// View own profile
// Edit own profile

export default function Profile(props) {
  const { userProfile } = useSession()
  return (
    <div className="flex flex-col space-y-1">
      <div>
        You are: <span className="font-bold">{userProfile.userName}</span>
      </div>
    </div>
  )
}
