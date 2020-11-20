import React from 'react'
import axios from 'axios'

import { useUserSessionContext } from '../../lib/user'
import Button from '../../components/Button'
import InputField from '../../components/InputField'

export default function Profile(props) {
  const {
    userAccount,
    userProfile,
    userSession,
    refetch,
  } = useUserSessionContext()

  const [name, setName] = React.useState('')
  const [result, setResult] = React.useState('')

  return (
    <div className="flex flex-col space-y-2">
      <div>
        You are: <span className="font-bold">{userProfile.userName}</span>
      </div>
      <div>
        You can change your name here, by filling in the Username field and
        clicking Submit.
      </div>
      <InputField
        id="profilename"
        label="Username"
        value={name}
        onChange={(value) => setName(value)}
      />
      <Button
        disabled={!name}
        onClick={async () => {
          // send API request and trigger refetch of profile
          try {
            await axios.post('/api/change-name', {
              email: userAccount.email,
              secret: userSession.fauna_token,
              name: name.trim(),
            })
            refetch()
            setResult('Success!')
          } catch (err) {
            console.error(err.response.data)
            setResult('Error: ' + err.response.data)
          }
        }}
      >
        Submit
      </Button>
      {result && <div>{result}</div>}
    </div>
  )
}
