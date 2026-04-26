import React from 'react'

import Meta from './Meta'
import Header from './Header'

class Page extends React.Component {
  render() {
    const { children, enableHeroText, flex } = this.props

    return (
      <main className={`page-main mb3 ${flex ? ' page-main--flex' : ''}`}>
        <Meta />
        <Header enableHeroText={enableHeroText} />
        <div className="page-content">{children}</div>
      </main>
    )
  }
}

export default Page
