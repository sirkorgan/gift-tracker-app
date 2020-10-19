import React from 'react'

export default function Button(props) {
  const { children, ...otherProps } = props
  return (
    <button
      {...otherProps}
      className="rounded-md py-1 px-2 bg-gray-200 hover:bg-gray-300"
    >
      <span>{children}</span>
    </button>
  )
}
