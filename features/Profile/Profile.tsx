import React from 'react'
import axios from 'axios'

import { useSession } from '../../lib/user'
import Button from '../../components/Button'

// View own profile
// Edit own profile

export function InputField(props) {
  const {
    label = '',
    initialValue = '',
    placeholder = '',
    onChange = (value: string) => {},
    className,
  } = props
  const [value, setValue] = React.useState(initialValue)
  return (
    <div className={className}>
      {label && (
        <label htmlFor="username" className="block font-semibold text-sm">
          {label}
        </label>
      )}
      <input
        type="text"
        id="profilename"
        name="profilename"
        placeholder={placeholder}
        value={value}
        className="border-gray-600 border rounded-md px-2 py-1"
        onChange={(event) => {
          setValue(event.target.value)
          onChange(event.target.value)
        }}
      />
    </div>
  )
}

export default function Profile(props) {
  const { userAccount, userProfile, userSession, refetch } = useSession()

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
      <InputField label="Username" onChange={(value) => setName(value)} />
      <Button
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
            console.log(err.response.data)
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
