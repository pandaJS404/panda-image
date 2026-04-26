import React from 'react'
import { Popover } from 'antd'

import { useKeyboardListener } from '../src/shared/react/hooks'
import ColorPicker from './ColorPicker'
import ButtonPrimitive from './buttons/ButtonPrimitive'
import { COLORS } from '../src/modules/editor/config'

function ModifierButton(props) {
  return (
    <ButtonPrimitive
      selected={props.selected}
      className="selection-editor-modifier-button"
      data-tone={props.tone || 'default'}
      onClick={props.onClick}
    >
      {props.children}
    </ButtonPrimitive>
  )
}

function reducer(state, action) {
  switch (action.type) {
    case 'BOLD':
      return {
        ...state,
        bold: !state.bold,
      }
    case 'ITALICS':
      return {
        ...state,
        italics: !state.italics,
      }
    case 'UNDERLINE':
      return {
        ...state,
        underline: Number(state.underline + 1) % 3,
      }
    case 'COLOR':
      return {
        ...state,
        color: action.color,
      }
    default:
      throw new Error('Invalid action')
  }
}

function SelectionEditor({ onChange }) {
  const [open, setOpen] = React.useState(false)

  useKeyboardListener('Escape', () => setOpen(false))

  const [state, dispatch] = React.useReducer(reducer, {
    bold: null,
    italics: null,
    underline: null,
    color: null,
  })

  React.useEffect(() => {
    onChange(state)
  }, [onChange, state])

  return (
    <div className="selection-editor">
      <div className="colorizer">
        <div className="modifier">
          <ModifierButton selected={state.bold} onClick={() => dispatch({ type: 'BOLD' })}>
            <b>B</b>
          </ModifierButton>
          <ModifierButton selected={state.italics} onClick={() => dispatch({ type: 'ITALICS' })}>
            <i>I</i>
          </ModifierButton>
          <ModifierButton
            selected={state.underline}
            onClick={() => dispatch({ type: 'UNDERLINE' })}
            tone={state.underline === 2 ? 'danger' : 'default'}
          >
            <u>U</u>
          </ModifierButton>
          <Popover
            trigger="click"
            placement="bottomLeft"
            open={open}
            onOpenChange={setOpen}
            classNames={{ root: 'selection-editor-popover' }}
            styles={{ body: { padding: 0 } }}
            getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
            content={
              <div className="color-picker-container">
                <ColorPicker
                  color={state.color || COLORS.PRIMARY}
                  disableAlpha={true}
                  onChange={data => dispatch({ type: 'COLOR', color: data.hex })}
                />
              </div>
            }
          >
            <ButtonPrimitive
              active={open}
              className="selection-editor-color-button"
              style={{
                background: state.color || COLORS.PRIMARY,
                boxShadow: `inset 0px 0px 0px ${open ? 2 : 1}px ${COLORS.SECONDARY}`,
              }}
            />
          </Popover>
        </div>
      </div>
    </div>
  )
}

export default SelectionEditor
