import React from 'react'
import { Card, Flex } from 'antd'

const ToolbarGroup = ({ children, className = '', gap = 0 }) => {
  if (!children) {
    return null
  }

  return (
    <Flex className={`toolbar-group${className ? ` ${className}` : ''}`} align="stretch" gap={gap}>
      {children}
    </Flex>
  )
}

const Toolbar = ({ style, className = '', leading, tools, portalSlot, exportActions }) => (
  <Card
    className={`toolbar toolbar-card${className ? ` ${className}` : ''}`}
    style={style}
    role="toolbar"
    variant="borderless"
    classNames={{ body: 'toolbar-card__body' }}
    styles={{ body: { padding: 0, background: 'transparent' } }}
  >
    <Flex className="toolbar-layout" align="stretch" gap={16}>
      <Flex className="toolbar-cluster toolbar-cluster--main" align="stretch" gap={16}>
        <ToolbarGroup className="toolbar-group--leading" gap={10}>
          {leading}
        </ToolbarGroup>
        <ToolbarGroup className="toolbar-group--tools" gap={20}>
          {tools}
        </ToolbarGroup>
      </Flex>

      <Flex className="toolbar-cluster toolbar-cluster--side" align="stretch" gap={12}>
        {portalSlot ? <div className="toolbar-portal">{portalSlot}</div> : null}
        <ToolbarGroup className="toolbar-group--primary toolbar-group--export" gap={8}>
          {exportActions}
        </ToolbarGroup>
      </Flex>
    </Flex>
  </Card>
)

export default Toolbar
