import React from 'react'
import Link from 'next/link'

import { useSession } from '../lib/user'

const Header = () => {
  const { userSession, userProfile } = useSession()

  return (
    <header className="">
      <nav>
        <h1>
          <Link href="/">
            <a className="text-5xl font-bold text-purple-500">Gift Tracker</a>
          </Link>
          <span> version 0.1.0 (alpha)</span>
        </h1>
        <div className="flex flex-row justify-between py-2 px-4 bg-purple-100">
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

            {userSession ? (
              <>
                <li>
                  <a href="/api/logout">Logout</a>
                </li>
              </>
            ) : (
              <>
                <li>
                  <a href="/api/login">Login / Signup</a>
                </li>
              </>
            )}
          </ul>
          {userProfile && (
            <span>
              Welcome, <span className="font-bold">{userProfile.userName}</span>
            </span>
          )}
        </div>
      </nav>
    </header>
  )
}
export default Header
