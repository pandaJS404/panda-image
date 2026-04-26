import React from 'react'
import { Helmet } from 'react-helmet-async'

export default function FontFace(config) {
  if (!config.fontUrl || !config.fontFamily) {
    return null
  }

  return (
    <Helmet>
      <style>
        {`@font-face { font-family: '${config.fontFamily}'; src: url(${config.fontUrl}) format('woff'); font-display: swap; }`}
      </style>
    </Helmet>
  )
}
