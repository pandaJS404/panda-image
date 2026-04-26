import React from 'react'

export default function ReferralLink(props) {
  const { className, style, children, ...rest } = props

  return (
    <a
      {...rest}
      target="_blank"
      rel="noopener noreferrer"
      className={`referral-link${className ? ` ${className}` : ''}`}
      style={style}
    >
      {children}
    </a>
  )
}
