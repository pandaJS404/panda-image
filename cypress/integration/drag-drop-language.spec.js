/* global cy */
import { editorVisible } from '../support'

const DROP_CASES = [
  {
    fileName: 'Component.vue',
    expectedMode: 'vue',
    snippet: `<template>
  <main class="hero">{{ title }}</main>
</template>

<script setup>
const title = 'Panda'
</script>`,
  },
  {
    fileName: 'Button.tsx',
    expectedMode: 'text/typescript-jsx',
    snippet: `type ButtonProps = {
  label: string
}

export function Button({ label }: ButtonProps) {
  return <button>{label}</button>
}`,
  },
  {
    fileName: 'notes.md',
    expectedMode: 'markdown',
    snippet: `# Panda

- drag
- drop`,
  },
  {
    fileName: 'site.css',
    expectedMode: 'css',
    snippet: `.hero {
  color: #334155;
}`,
  },
]

function dropFile({ fileName, snippet }) {
  cy.window().then(win => {
    const file = new win.File([snippet], fileName, { type: '' })
    const dataTransfer = new win.DataTransfer()

    dataTransfer.items.add(file)

    cy.get('.editor')
      .trigger('dragenter', { dataTransfer, force: true })
      .trigger('drop', { dataTransfer, force: true })
  })
}

describe('drag-drop language detection', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
    editorVisible()
  })

  DROP_CASES.forEach(({ fileName, expectedMode, snippet }) => {
    it(`recognizes ${fileName} when dragged into the editor`, () => {
      dropFile({ fileName, snippet })

      cy.get('.CodeMirror').should(([element]) => {
        expect(element.CodeMirror.getValue()).to.eq(snippet)
        expect(element.CodeMirror.getOption('mode')).to.eq(expectedMode)
      })
    })
  })
})
