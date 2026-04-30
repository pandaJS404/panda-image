import React from 'react'
import { CheckCircleFilled } from '@ant-design/icons'
import { Select } from 'antd'

const DEFAULT_SELECT_CLASS_NAMES = {
  prefix: 'list-setting-display-prefix',
  content: 'list-setting-display-content',
  popup: {
    root: 'list-setting-popover',
    list: 'list-setting-list',
    listItem: 'list-setting-option',
  },
}

const getClassName = (...parts) => parts.filter(Boolean).join(' ')

const getFallbackSelectedItem = selected =>
  selected == null ? {} : { id: selected, name: String(selected) }

function renderItemContent(render, item, selected) {
  if (typeof render !== 'function') {
    return <span>{item?.name}</span>
  }

  return render(item, selected)
}

function ListSetting({
  items,
  selected,
  title,
  children,
  onChange,
  onOpen = () => {},
  onClose = () => {},
  className = '',
  listClassName = '',
  displayClassName = '',
  popoverClassName = '',
  popoverStyles,
}) {
  const [open, setOpen] = React.useState(false)
  const openRef = React.useRef(false)

  const itemMap = React.useMemo(() => {
    return new Map(items.map(item => [item.id, item]))
  }, [items])

  const selectedItem = itemMap.get(selected) || getFallbackSelectedItem(selected)

  const options = React.useMemo(() => {
    return items.map(item => ({
      value: item.id,
      label: item.name,
      item,
    }))
  }, [items])

  const handleOpenChange = nextOpen => {
    if (openRef.current === nextOpen) {
      return
    }

    openRef.current = nextOpen
    setOpen(nextOpen)

    if (nextOpen) {
      onOpen()
      return
    }

    onClose()
  }

  const handleSelect = (nextValue, option) => {
    const nextId = option?.item?.id ?? nextValue?.value ?? nextValue

    if (nextId != null && nextId !== selected) {
      onChange(nextId)
    }

    handleOpenChange(false)
  }

  return (
    <div className={getClassName('list-select-container', className)} data-open={open || undefined}>
      <Select
        open={open}
        value={
          selectedItem.id != null
            ? {
                value: selectedItem.id,
                label: selectedItem.name,
              }
            : undefined
        }
        labelInValue
        size="small"
        variant="filled"
        listHeight={160}
        options={options}
        placement="bottomRight"
        popupMatchSelectWidth
        prefix={<span className="label">{title}</span>}
        className={getClassName(
          'list-setting-display-button',
          open && 'list-setting-display-button--open',
          displayClassName,
        )}
        classNames={{
          ...DEFAULT_SELECT_CLASS_NAMES,
          popup: {
            ...DEFAULT_SELECT_CLASS_NAMES.popup,
            root: getClassName(DEFAULT_SELECT_CLASS_NAMES.popup.root, popoverClassName),
            list: getClassName(DEFAULT_SELECT_CLASS_NAMES.popup.list, listClassName),
          },
        }}
        styles={{
          popup: {
            root: popoverStyles?.root,
            list: popoverStyles?.list,
            listItem: popoverStyles?.listItem,
          },
        }}
        onSelect={handleSelect}
        onOpenChange={handleOpenChange}
        optionRender={({ data }) => (
          <div className="list-setting-item-button">
            {renderItemContent(children, data.item, selected)}
            {selected === data.item.id ? <CheckCircleFilled /> : null}
          </div>
        )}
        labelRender={({ value }) => {
          const activeItem = itemMap.get(value) || selectedItem

          return (
            <span className="list-setting-display-value">
              {renderItemContent(children, activeItem, selected)}
            </span>
          )
        }}
        popupRender={originNode => (
          <div className="list-setting-popover__container" style={popoverStyles?.container}>
            <div className="list-setting-popover__content" style={popoverStyles?.content}>
              {originNode}
            </div>
          </div>
        )}
        getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
      />
    </div>
  )
}

export default React.memo(ListSetting)
