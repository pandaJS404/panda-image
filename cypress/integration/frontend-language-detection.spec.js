/* global cy */
import { editorVisible } from '../support'

const VUE_SFC_CODE = `<template>
  <section class="hero">{{ title }}</section>
</template>

<script setup lang="ts">
const title = 'Panda'
</script>

<style scoped>
.hero {
  color: #334155;
}
</style>`

const REACT_JSX_CODE = `import React from 'react'

export default function App() {
  return <main className="app-shell">Hello Panda</main>
}`

const REACT_TSX_CODE = `import React from 'react'

type ButtonProps = {
  title: string
}

export function Button({ title }: ButtonProps) {
  return <button className="button">{title}</button>
}`

describe('frontend language detection', () => {
  it('detects Vue single-file components in auto mode', () => {
    cy.visit(`/?code=${encodeURIComponent(VUE_SFC_CODE)}`)
    editorVisible()

    cy.get('.CodeMirror').should(([element]) => {
      expect(element.CodeMirror.getOption('mode')).to.eq('vue')
    })
  })

  it('detects React JSX in auto mode', () => {
    cy.visit(`/?code=${encodeURIComponent(REACT_JSX_CODE)}`)
    editorVisible()

    cy.get('.CodeMirror').should(([element]) => {
      expect(element.CodeMirror.getOption('mode')).to.eq('jsx')
    })
  })

  it('detects React TSX in auto mode', () => {
    cy.visit(`/?code=${encodeURIComponent(REACT_TSX_CODE)}`)
    editorVisible()

    cy.get('.CodeMirror').should(([element]) => {
      expect(element.CodeMirror.getOption('mode')).to.eq('text/typescript-jsx')
    })
  })
})
