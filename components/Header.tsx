import React from 'react'
import Link from 'next/link'

import { useUserSessionContext } from '../lib/user'

const Header = () => {
  const { userProfile } = useUserSessionContext()

  return (
    <header className="">
      <nav>
        <h1>
          <Link href="/">
            <a className="text-2xl font-bold text-green-700 px-2">
              Gift Tracker
            </a>
          </Link>
        </h1>
        <div className="flex flex-row justify-between py-2 px-4 bg-green-100">
          <ul className="flex flex-row space-x-4">
            <li>
              <Link href="/">
                <a>Home</a>
              </Link>
            </li>
            <li>
              <Link href="/profile">
                <a>Profile</a>
              </Link>
            </li>

            {userProfile ? (
              <li>
                <Link href="/api/logout">
                  <a>Logout</a>
                </Link>
              </li>
            ) : (
              <li>
                <Link href="/api/login">
                  <a>Login / Signup</a>
                </Link>
              </li>
            )}
          </ul>
          {userProfile && (
            <span>
              Welcome,{' '}
              <Link href="/profile">
                <a className="font-bold">{userProfile.userName}</a>
              </Link>
            </span>
          )}
        </div>
      </nav>
    </header>
  )
}
export default Header
