import React from 'react'
import { Popover } from 'antd'

import ButtonPrimitive from './buttons/ButtonPrimitive'
import SvgAsset from './svg/SvgAsset'
import CheckmarkAsset from './svg/assets/checkmark.svg?react'

const DEFAULT_POPOVER_CLASS_NAMES = {
  root: 'list-setting-popover',
  container: 'list-setting-popover__container',
  content: 'list-setting-popover__content',
}

class ListSetting extends React.Component {
  static defaultProps = {
    onOpen: () => {},
    onClose: () => {},
    className: '',
    listClassName: '',
    displayClassName: '',
    popoverClassName: '',
    popoverStyles: undefined,
  }

  state = { isVisible: false }

  select = id => {
    if (this.props.selected !== id) {
      this.props.onChange(id)
    }

    this.handleOpenChange(false)
  }

  handleOpenChange = isVisible => {
    const handler = isVisible ? this.props.onOpen : this.props.onClose
    handler()
    this.setState({ isVisible })
  }

  handleTriggerKeyDown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.handleOpenChange(!this.state.isVisible)
    }
  }

  handleItemKeyDown = id => event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.select(id)
    }
  }

  renderListItems() {
    return this.props.items.map(item => (
      <ButtonPrimitive
        key={item.id}
        fullWidth
        className="list-setting-item-button"
        onClick={this.select.bind(null, item.id)}
        onKeyDown={this.handleItemKeyDown(item.id)}
      >
        {this.props.children(item, this.props.selected)}
        {this.props.selected === item.id ? <SvgAsset component={CheckmarkAsset} /> : null}
      </ButtonPrimitive>
    ))
  }

  render() {
    const {
      items,
      selected,
      title,
      children,
      className,
      listClassName,
      displayClassName,
      popoverClassName,
      popoverStyles,
    } = this.props
    const { isVisible } = this.state

    const selectedItem = items.filter(item => item.id === selected)[0] || {}
    const popoverClassNames = {
      ...DEFAULT_POPOVER_CLASS_NAMES,
      root: [DEFAULT_POPOVER_CLASS_NAMES.root, popoverClassName].filter(Boolean).join(' '),
    }

    return (
      <div className={`list-select-container${className ? ` ${className}` : ''}`}>
        <Popover
          trigger="click"
          placement="bottomLeft"
          open={isVisible}
          arrow={false}
          classNames={popoverClassNames}
          styles={popoverStyles}
          onOpenChange={this.handleOpenChange}
          getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
          content={
            <div className={`list-setting-list${listClassName ? ` ${listClassName}` : ''}`}>
              {this.renderListItems()}
            </div>
          }
        >
          <ButtonPrimitive
            fullWidth
            active={isVisible}
            className={`list-setting-display-button${displayClassName ? ` ${displayClassName}` : ''}`}
            onKeyDown={this.handleTriggerKeyDown}
          >
            <span className="label">{title}</span>
            {children(selectedItem)}
          </ButtonPrimitive>
        </Popover>
      </div>
    )
  }
}

export default ListSetting
