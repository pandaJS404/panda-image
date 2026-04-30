import React from 'react'

import ListSetting from './ListSetting'
import { FONTS } from '../src/modules/editor/config'
import { fileToDataURL as blobToUrl } from '../src/shared/utils'

const EXTENSIONS = ['.otf', '.ttf', '.woff']

const Font = ({ id, name }) => {
  const fontStyle = id === 'upload' ? undefined : { fontFamily: id }
  const labelClassName = `font-option-label${id === 'upload' ? ' font-option-label--upload' : ''}`

  return (
    <>
      <span className={labelClassName} style={fontStyle}>
        {name}
      </span>
    </>
  )
}

function FontSelect(props) {
  const inputEl = React.useRef(null)
  const { fonts = FONTS, title = 'Font', uploadLabel = 'Upload font +', allowUpload = true } = props

  function onChange(id) {
    if (allowUpload && id === 'upload') {
      inputEl.current?.click()
      return
    }

    props.onChange(id)
  }

  async function onFiles(event) {
    const { files } = event.target

    if (!files?.[0]) {
      return
    }

    const name = files[0].name.split('.')[0]
    const url = await blobToUrl(files[0])

    props.onUpload(name, url)
  }

  return (
    <div className="font-select">
      <ListSetting
        title={title}
        items={allowUpload ? [{ id: 'upload', name: uploadLabel }, ...fonts] : fonts}
        listClassName="font-select-list"
        popoverClassName="font-select-popover"
        {...props}
        onChange={onChange}
      >
        {Font}
      </ListSetting>
      {allowUpload ? (
        <input
          hidden
          ref={inputEl}
          type="file"
          multiple
          accept={EXTENSIONS.join(',')}
          onChange={onFiles}
        />
      ) : null}
    </div>
  )
}

export default FontSelect
