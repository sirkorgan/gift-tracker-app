import React from 'react'

function InputField(props: {
  id: string
  label?: string
  initialValue?: string
  placeholder?: string
  onChange?: (value: string) => void
  className?: string
}) {
  const {
    id,
    label = '',
    initialValue = '',
    placeholder = '',
    onChange = (value: string) => {},
    className,
  } = props
  const [value, setValue] = React.useState(initialValue)
  return (
    <div className={'space-y-1 ' + className}>
      {label && (
        <label htmlFor={id} className="block font-bold text-sm text-gray-700">
          {label}
        </label>
      )}
      <input
        type="text"
        id={id}
        name={id}
        placeholder={placeholder}
        value={value}
        className="border-gray-400 border rounded-md px-2 py-1"
        onChange={(event) => {
          setValue(event.target.value)
          onChange(event.target.value)
        }}
      />
    </div>
  )
}

export default InputField
