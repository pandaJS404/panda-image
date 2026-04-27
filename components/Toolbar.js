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

const Toolbar = ({ style, className = '', leading, tools, exportActions }) => (
  <div className={`toolbar ${className ? ` ${className}` : ''}`} style={style}>
    <Flex className="toolbar-layout" align="stretch" gap={20}>
      <Flex className="toolbar-cluster toolbar-cluster--main" align="stretch" gap={20}>
        <ToolbarGroup className="toolbar-group--leading" gap={10}>
          {leading}
        </ToolbarGroup>
        <ToolbarGroup className="toolbar-group--tools" gap={10}>
          {tools}
        </ToolbarGroup>
        <ToolbarGroup className="toolbar-group--primary toolbar-group--export" gap={10}>
          {exportActions}
        </ToolbarGroup>
      </Flex>
    </Flex>
  </div>
)

export default Toolbar
