import React from 'react'
import classNames from 'classnames'

export default function Button(props) {
  const { children, disabled, ...otherProps } = props
  return (
    <button
      {...otherProps}
      disabled={disabled}
      className={classNames(
        'rounded-md py-1 px-2 bg-purple-200 hover:bg-purple-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span>{children}</span>
    </button>
  )
}
