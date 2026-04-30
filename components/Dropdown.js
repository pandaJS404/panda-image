import React from 'react'
import { CheckCircleFilled, DownOutlined } from '@ant-design/icons'
import { Select } from 'antd'
import { matchSorter } from 'match-sorter'
import { syncDomAttribute } from '../src/shared/react/hooks'

const DROPDOWN_CLASS_NAMES = {
  prefix: 'dropdown-select__prefix',
  suffix: 'dropdown-select__suffix',
  input: 'dropdown-select__input',
  placeholder: 'dropdown-select__placeholder',
  content: 'dropdown-select__content',
  popup: {
    root: 'dropdown-list-popup',
    list: 'dropdown-list-popup__list',
    listItem: 'dropdown-list-popup__item',
  },
}

const getItemValue = (item, index) =>
  `${item?.id || item?.mode || item?.mime || item?.name || 'item'}-${index}`

const selectedIcon = <CheckCircleFilled />

const getListIndex = (list, item) => {
  const exactIndex = list.findIndex(candidate => candidate === item)

  if (exactIndex > -1) {
    return exactIndex
  }

  return list.findIndex(
    candidate =>
      candidate &&
      item &&
      candidate.id === item.id &&
      candidate.mode === item.mode &&
      candidate.mime === item.mime &&
      candidate.name === item.name,
  )
}

const Dropdown = React.memo(
  ({
    innerRef,
    selected,
    list,
    onChange,
    itemWrapper,
    icon,
    disableInput,
    onOpen,
    title,
    'aria-tooltip': ariaTooltip,
    className = '',
    ...props
  }) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState('')
    const selectRef = React.useRef(null)

    const itemsToShow = searchValue ? matchSorter(list, searchValue, { keys: ['name'] }) : list

    React.useImperativeHandle(innerRef, () => ({
      blur: () => selectRef.current?.blur?.(),
      focus: () => selectRef.current?.focus?.(),
      closeMenu: () => setIsOpen(false),
    }))

    const options = itemsToShow.map(item => ({
      value: getItemValue(item, getListIndex(list, item)),
      label: item.name,
      item,
    }))

    const selectedIndex = getListIndex(list, selected)
    const selectedValue = {
      value:
        selectedIndex > -1 ? getItemValue(selected, selectedIndex) : selected?.name || 'selected',
      label: selected?.name,
    }

    const suffixIcon = (
      <span className="dropdown-arrow-icon">
        <DownOutlined />
      </span>
    )

    const handleOpenChange = open => {
      setIsOpen(open)
      setSearchValue('')

      if (open && typeof onOpen === 'function') {
        onOpen()
      }
    }

    const handleChange = (_, option) => {
      if (option?.item) {
        onChange(option.item)
      }

      setIsOpen(false)
      setSearchValue('')
    }

    const dropdownNode = (
      <DropdownContainer className={className} isOpen={isOpen} ariaTooltip={ariaTooltip} {...props}>
        <Select
          ref={selectRef}
          open={isOpen}
          value={selectedValue}
          labelInValue
          size="small"
          variant="filled"
          showSearch={!disableInput}
          autoClearSearchValue={false}
          searchValue={searchValue}
          listHeight={350}
          virtual={false}
          filterOption={false}
          popupMatchSelectWidth={false}
          options={options}
          transitionName=""
          onSearch={setSearchValue}
          onChange={handleChange}
          onOpenChange={handleOpenChange}
          optionRender={option =>
            renderListItem({
              children: option.data.item.name,
              item: option.data.item,
              itemWrapper,
              isSelected: selected?.name === option.data.item.name,
            })
          }
          labelRender={({ label }) => <span className="dropdown-display-text">{label}</span>}
          menuItemSelectedIcon={selectedIcon}
          prefix={icon ? <span className="dropdown-prefix">{icon}</span> : undefined}
          suffixIcon={suffixIcon}
          classNames={DROPDOWN_CLASS_NAMES}
          className={`dropdown-select${isOpen ? ' dropdown-select--open' : ''}`}
          data-cy="theme-selector-button"
          getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
        />
      </DropdownContainer>
    )

    if (!title) {
      return dropdownNode
    }

    return dropdownNode
  },
)

const DropdownContainer = ({ children, className, isOpen, ariaTooltip, ...props }) => {
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    syncDomAttribute(containerRef.current, 'aria-tooltip', ariaTooltip)
  }, [ariaTooltip])

  return (
    <div
      ref={containerRef}
      className={`dropdown-container${className ? ` ${className}` : ''}`}
      data-open={isOpen || undefined}
      {...props}
    >
      {children}
    </div>
  )
}

const renderListItem = ({ children, isSelected, itemWrapper, item }) => {
  return (
    <div
      className={`dropdown-list-item-content${isSelected ? ' is-selected' : ''}`}
      data-cy="dropdown-item"
    >
      {itemWrapper ? (
        itemWrapper({ children, item, isSelected })
      ) : (
        <span className="dropdown-list-item-text">{children}</span>
      )}
    </div>
  )
}

export default Dropdown
