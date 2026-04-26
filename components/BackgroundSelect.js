import React from 'react'
import { Popover, Tabs } from 'antd'

import ImagePicker from './ImagePicker'
import ColorPicker from './ColorPicker'
import ButtonPrimitive from './buttons/ButtonPrimitive'
import { DEFAULT_BG_COLOR } from '../src/modules/editor/config'
import { stringifyColor } from '../src/shared/utils'

function validateColor(str) {
  if (/#\d{3,6}|rgba{0,1}\(.*?\)/gi.test(str) || /\w+/gi.test(str)) {
    return str
  }

  return null
}

function BackgroundSelect({
  color,
  mode,
  image,
  onChange,
  pandaRef,
  updateHighlights,
}) {
  const [open, setOpen] = React.useState(false)

  const background = validateColor(color) ? color : DEFAULT_BG_COLOR
  const aspectRatio = pandaRef ? pandaRef.clientWidth / pandaRef.clientHeight : 1

  const selectTab = nextMode => {
    if (mode !== nextMode) {
      onChange({ backgroundMode: nextMode })
    }
  }

  const handlePickColor = nextColor => {
    onChange({ backgroundColor: stringifyColor(nextColor) })
  }

  return (
    <div className="bg-select-container">
      <Popover
        trigger="click"
        placement="bottomLeft"
        open={open}
        onOpenChange={setOpen}
        classNames={{ root: 'bg-select-popover' }}
        styles={{ body: { padding: 0 } }}
        getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
        content={
          <div id="bg-select-pickers" className="bg-select-panel">
            <Tabs
              activeKey={mode}
              className="bg-select-tabs"
              items={[
                {
                  key: 'color',
                  label: '颜色',
                  children: (
                    <div className="picker-tabs-contents">
                      <ColorPicker color={color} onChange={handlePickColor} />
                    </div>
                  ),
                },
                {
                  key: 'image',
                  label: '图片',
                  children: (
                    <div className="picker-tabs-contents">
                      <ImagePicker
                        onChange={onChange}
                        imageDataURL={image}
                        aspectRatio={aspectRatio}
                        updateHighlights={updateHighlights}
                      />
                    </div>
                  ),
                },
              ]}
              onChange={selectTab}
            />
          </div>
        }
      >
        <ButtonPrimitive
          tooltipTitle="背景菜单"
          fullWidth
          active={open}
          className="bg-color-container bg-select-display"
          data-cy="display"
        >
          <div className="bg-color-alpha" />
          <div
            className="bg-color"
            style={
              mode === 'image'
                ? {
                    backgroundImage: image ? `url(${image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                  }
                : { background }
            }
          />
        </ButtonPrimitive>
      </Popover>
    </div>
  )
}

export default React.memo(BackgroundSelect)
