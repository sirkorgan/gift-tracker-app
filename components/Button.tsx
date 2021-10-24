import React from 'react'
import classNames from 'classnames'

function Button(props, ref) {
  const { children, disabled, ...otherProps } = props
  return (
    <button
      {...otherProps}
      ref={ref}
      disabled={disabled}
      className={classNames(
        'rounded-md py-1 px-2 bg-green-200 hover:bg-green-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span>{children}</span>
    </button>
  )
}

export default React.forwardRef(Button)
