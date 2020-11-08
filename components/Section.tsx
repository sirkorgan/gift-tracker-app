import React from 'react'

function Section(props) {
  const { className, children } = props
  return (
    <section
      className={
        'flex flex-col space-y-2 p-4 border rounded-lg bg-white ' + className
      }
    >
      {children}
    </section>
  )
}

export default Section
