import React from 'react'

export default function Heading(props) {
  const { children, ...otherProps } = props
  return (
    <h2 {...otherProps} className="font-bold text-lg">
      {children}
    </h2>
  )
}
