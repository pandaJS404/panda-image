import React from 'react'
import { Helmet } from 'react-helmet-async'
import { THEMES, THEMES_HASH } from '../src/modules/editor/config'
import { getThemeStatusBarStyle } from '../src/theme'
import { useUiTheme } from '../src/ui-theme'

const CODEMIRROR_VERSION = '5.65.5'

export const HIGHLIGHTS_ONLY = [
  'shades-of-purple',
  'vscode',
  'a11y-dark',
  'slate-dark',
  'slate-light',
  'panda-Gradation',
  'Panda-Gradation',
  'vscode-Gradation',
]
const LOCAL_STYLESHEETS = ['one-light', 'one-dark', 'verminal', 'night-owl', 'nord', 'synthwave-84']
const CDN_STYLESHEETS = THEMES.filter(
  t => LOCAL_STYLESHEETS.indexOf(t.id) < 0 && HIGHLIGHTS_ONLY.indexOf(t.id) < 0,
)

export function Link({ href }) {
  return (
    <Helmet>
      <link rel="preload" as="style" href={href} />
      <link rel="stylesheet" href={href} />
    </Helmet>
  )
}

export const StylesheetLink = ({ theme }) => {
  let href
  if (LOCAL_STYLESHEETS.indexOf(theme) > -1) {
    href = `/static/themes/${theme}.min.css`
  } else {
    const themeDef = THEMES_HASH[theme]
    href = `//cdnjs.cloudflare.com/ajax/libs/codemirror/${CODEMIRROR_VERSION}/theme/${
      themeDef && (themeDef.link || themeDef.id)
    }.min.css`
  }

  return <Link href={href} />
}

export const CodeMirrorLink = () => (
  <Link
    href={`//cdnjs.cloudflare.com/ajax/libs/codemirror/${CODEMIRROR_VERSION}/codemirror.min.css`}
  />
)

const title = 'Panda'
const description = 'Panda 是一个将源码快速生成精美图片的单页编辑器。'
const normalizeOrigin = value => value.replace(/\/$/u, '')
const configuredSiteOrigin = normalizeOrigin(
  import.meta.env.VITE_SITE_URL || import.meta.env.NEXT_PUBLIC_SITE_URL || '',
)

function getAbsoluteAssetUrl(path) {
  if (configuredSiteOrigin) {
    return `${configuredSiteOrigin}${path}`
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}${path}`
  }

  return path
}

export const MetaTags = React.memo(() => {
  const { colors, uiTheme } = useUiTheme()

  return (
    <Helmet>
      <meta charSet="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <html lang="zh-CN" data-ui-theme={uiTheme} />
      <meta name="description" content={description} />
      <meta name="application-name" content={title} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:site" content="@PandaImg_app" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="og:title" content={title} />
      <meta name="og:description" content={description} />
      <meta name="theme-color" content={colors.meta} />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content={getThemeStatusBarStyle(uiTheme)}
      />
      <title>{`${title} | 将源码生成精美图片`}</title>
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/static/brand/apple-touch-icon.png" />
    </Helmet>
  )
})

export const MetaLinks = React.memo(() => {
  return (
    <React.Fragment>
      <Link
        href={`//cdnjs.cloudflare.com/ajax/libs/codemirror/${CODEMIRROR_VERSION}/theme/seti.min.css`}
      />
      <CodeMirrorLink />
      {LOCAL_STYLESHEETS.map(id => (
        <Link key={id} href={`/static/themes/${id}.min.css`} />
      ))}
      {CDN_STYLESHEETS.map(themeDef => {
        const href = `//cdnjs.cloudflare.com/ajax/libs/codemirror/${CODEMIRROR_VERSION}/theme/${
          themeDef && (themeDef.link || themeDef.id)
        }.min.css`
        return <Link key={themeDef.id} href={href} />
      })}
    </React.Fragment>
  )
})

export default React.memo(function Meta() {
  return (
    <React.Fragment>
      <MetaTags />
    </React.Fragment>
  )
})
