// Theirs
import React from 'react'

export default function GlobalHighlights({ highlights }) {
  React.useEffect(() => {
    const root = document.documentElement
    const previousValues = {}
    const entries = [
      ['--cm-background', highlights.background],
      ['--cm-text', highlights.text],
      ['--cm-string', highlights.string],
      ['--cm-comment', highlights.comment],
      ['--cm-variable', highlights.variable],
      ['--cm-variable-2', highlights.variable2 || highlights.variable],
      ['--cm-variable-3', highlights.variable3 || highlights.variable],
      ['--cm-number', highlights.number],
      ['--cm-keyword', highlights.keyword],
      ['--cm-property', highlights.property],
      ['--cm-definition', highlights.definition],
      ['--cm-meta', highlights.meta],
      ['--cm-operator', highlights.operator],
      ['--cm-attribute', highlights.attribute],
      ['--cm-tag', highlights.tag],
      ['--cm-builtin', highlights.builtin],
    ]

    entries.forEach(([key, value]) => {
      previousValues[key] = root.style.getPropertyValue(key)
      if (value) {
        root.style.setProperty(key, value)
      }
    })

    return () => {
      entries.forEach(([key]) => {
        if (previousValues[key]) {
          root.style.setProperty(key, previousValues[key])
        } else {
          root.style.removeProperty(key)
        }
      })
    }
  }, [highlights])

  return null
}
