import React from 'react'
import { BgColorsOutlined, DeleteOutlined } from '@ant-design/icons'
import { Popover } from 'antd'

import GlobalHighlights from './GlobalHighlights'
import Dropdown from '../Dropdown'
import ReferralLink from '../ReferralLink'
import ButtonPrimitive from '../buttons/ButtonPrimitive'

const ThemeCreate = React.lazy(() => import('./ThemeCreate'))

const CUSTOM_THEME_PREFIX = '自定义主题'

const ThemeItem = ({ children, item, isSelected, remove }) => (
  <div className={`theme-item${item.id === 'create' ? ' theme-item--create' : ''}`}>
    <span className="theme-item-content">{children}</span>
    {item.referral ? (
      <div className={`theme-item-referral${isSelected ? ' is-selected' : ''}`}>
        <ReferralLink href={item.referral}>购买</ReferralLink>
      </div>
    ) : null}
    {item.custom && !isSelected ? (
      <ButtonPrimitive
        iconOnly
        className="theme-item-remove-button"
        tooltipTitle="移除主题"
        onClick={event => {
          event.stopPropagation()
          remove(item.id)
        }}
      >
        <DeleteOutlined />
      </ButtonPrimitive>
    ) : null}
  </div>
)

const isCustomThemeName = name =>
  name.startsWith(CUSTOM_THEME_PREFIX) || name.startsWith('Custom Theme')

const getCustomName = themes =>
  `${CUSTOM_THEME_PREFIX} ${themes.filter(({ name }) => isCustomThemeName(name)).length + 1}`

function Themes({ themes, theme, highlights, update, create, remove, updateHighlights }) {
  const [name, setName] = React.useState('')
  const [isCreateOpen, setCreateOpen] = React.useState(false)
  const dropdown = React.useRef(null)

  React.useEffect(() => {
    if (!isCreateOpen) {
      setName(getCustomName(themes))
    }
  }, [themes, isCreateOpen])

  const mergedHighlights = { ...theme.highlights, ...highlights }
  const dropdownValue = isCreateOpen ? { name } : theme
  const dropdownList = [{ id: 'create', name: '新建主题 +' }, ...themes]

  const handleThemeSelected = nextTheme => {
    if (!nextTheme) {
      return
    }

    if (nextTheme.id === 'create') {
      dropdown.current?.closeMenu?.()
      setCreateOpen(true)
      return
    }

    setCreateOpen(false)
    update(nextTheme.id)
  }

  const handleCreate = nextTheme => {
    setCreateOpen(false)
    create(nextTheme)
  }

  return (
    <div className="themes" data-cy="themes-container">
      <Dropdown
        title="主题"
        innerRef={dropdown}
        icon={<BgColorsOutlined />}
        disableInput={isCreateOpen}
        selected={dropdownValue}
        list={dropdownList}
        itemWrapper={props => <ThemeItem {...props} remove={remove} />}
        onChange={handleThemeSelected}
        onOpen={() => {
          if (isCreateOpen) {
            setCreateOpen(false)
          }
        }}
      />
      <Popover
        trigger="click"
        placement="bottomLeft"
        open={isCreateOpen}
        onOpenChange={setCreateOpen}
        classNames={{ root: 'theme-create-popover theme-create-popup' }}
        styles={{ body: { padding: 0 } }}
        getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
        content={
          isCreateOpen ? (
            <React.Suspense fallback={null}>
              <ThemeCreate
                theme={theme}
                themes={themes}
                highlights={mergedHighlights}
                create={handleCreate}
                updateHighlights={updateHighlights}
                name={name}
                onInputChange={event => setName(event.target.value)}
              />
            </React.Suspense>
          ) : null
        }
      >
        <span className="theme-create-anchor" />
      </Popover>
      <GlobalHighlights highlights={mergedHighlights} />
    </div>
  )
}

export default React.memo(Themes)
