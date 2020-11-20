import React from 'react'

function InputField(props: {
  id: string
  label?: string
  value: string
  placeholder?: string
  onChange?: (value: string) => void
  className?: string
}) {
  const {
    id,
    label = '',
    value = '',
    placeholder = '',
    onChange = (value: string) => {},
    className,
  } = props
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
          onChange(event.target.value)
        }}
      />
    </div>
  )
}

export default InputField
