import React from 'react'
import { isDroppedTextFile } from '../src/modules/editor/language'

const DATA_URL = 'DATA_URL'
const TEXT = 'TEXT'
const style = { outline: 'none' }

function getReadMode(file) {
  if (isDroppedTextFile(file)) {
    return TEXT
  }

  if (file.type === '') {
    return DATA_URL
  }

  switch (file.type.split('/')[0]) {
    case 'application':
    case 'text':
      return TEXT
    case 'image':
    case 'video':
      return DATA_URL
    default:
      return TEXT
  }
}

function readFile(file) {
  return new Promise(resolve => {
    const reader = new FileReader()

    reader.onload = event => {
      file.content = event.target.result
      resolve(file)
    }

    if (getReadMode(file) === DATA_URL) {
      reader.readAsDataURL(file)
    } else {
      reader.readAsText(file, 'UTF-8')
    }
  })
}

function hasFileTransfer(event) {
  const { types } = event.dataTransfer || {}

  return Array.from(types || []).includes('Files')
}

function FileDropzone({ children, filter = file => file, onDrop }) {
  const [lastContent, setLastContent] = React.useState(null)
  const [history, setHistory] = React.useState([])
  const [dragDepth, setDragDepth] = React.useState(0)

  const handleDrop = React.useCallback(
    event => {
      if (!hasFileTransfer(event)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      setDragDepth(0)

      const files = Array.from(event.dataTransfer.files || [])

      if (!files[0]) {
        return
      }

      Promise.all(files.filter(filter).map(readFile)).then(content => {
        if (!content.length) {
          return
        }

        setLastContent(content)
        setHistory(currentHistory => [content, ...currentHistory])
        onDrop(content)
      })
    },
    [filter, onDrop],
  )

  const handleDragEnter = React.useCallback(event => {
    if (!hasFileTransfer(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setDragDepth(currentDepth => currentDepth + 1)
  }, [])

  const handleDragLeave = React.useCallback(event => {
    if (!hasFileTransfer(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setDragDepth(currentDepth => Math.max(currentDepth - 1, 0))
  }, [])

  const handleDragOver = React.useCallback(event => {
    if (!hasFileTransfer(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const isOver = dragDepth > 0

  return (
    <div
      style={style}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
    >
      {children({
        canDrop: isOver,
        files: lastContent,
        history,
        isOver,
      })}
    </div>
  )
}

export default FileDropzone
