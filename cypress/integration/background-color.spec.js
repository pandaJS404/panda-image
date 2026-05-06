/* global cy */
import { editorVisible, readEditorStorage } from '../support'

// usually we can visit the page before each test
// but these tests use the url, which means wasted page load
// so instead visit the desired url in each test

describe('background color', () => {
  const bgColor = '.bg-color-container .bg-color'
  const modal = '.bg-select-modal'
  const picker = `${modal} #bg-select-pickers`

  const openPicker = () => {
    cy.get(bgColor).click()
    return cy.get(picker).should('be.visible')
  }

  const openColorPicker = () => {
    openPicker()
    cy.get('.bg-select-panel .ant-tabs-tab').eq(0).click()
    return cy.get(picker).should('be.visible')
  }

  const closePicker = () => cy.get(`${modal} .ant-modal-close`).click()

  it('starts with Panda Gradation and the first Panda image', () => {
    cy.visit('/')
    editorVisible()

    cy.get('[data-cy="themes-container"] .dropdown-display-text')
      .should('contain', 'Panda')
      .and('contain', 'Gradation')
    cy.get('.container-bg .bg')
      .invoke('attr', 'style')
      .should('contain', 'panda-bg-01')
      .and('contain', 'url(')
    cy.get('.bg-color-container .bg-color')
      .invoke('attr', 'style')
      .should('contain', 'panda-bg-01')
      .and('contain', 'url(')
  })

  it('opens BG color pick', () => {
    cy.visit('/')
    openPicker()
    closePicker()
    cy.get(modal).should('not.exist')
  })

  it('changes background color to dark red', () => {
    cy.visit('/')
    const darkRed = '#D0021B'
    const darkRedTile = `[title="${darkRed}"]`
    openColorPicker()
    cy.get(picker).find(darkRedTile).click()
    closePicker()

    // changing background color triggers url change
    // confirm color change
    cy.get('.container-bg .bg').should('have.css', 'background-color', 'rgb(208, 2, 27)')
  })

  it('restores color from persisted storage', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {
              backgroundColor: 'rgb(255,0,0)',
              backgroundMode: 'color',
            },
            editor: {},
            watermark: {},
            theme: {},
            code: {},
            assets: {},
          }),
        )
      },
    })
    editorVisible()
    cy.get('.container-bg .bg').should('have.css', 'background-color', 'rgb(255, 0, 0)')
  })

  it('restores color from semantic persisted storage', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {
              backgroundColor: 'rgb(255,0,0)',
              backgroundMode: 'color',
            },
            editor: {},
            watermark: {},
            theme: {},
            code: {},
            assets: {},
          }),
        )
      },
    })
    editorVisible()
    cy.get('.container-bg .bg').should('have.css', 'background-color', 'rgb(255, 0, 0)')
  })

  it('updates the stored color to neon pink', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {
              backgroundColor: 'rgb(255,0,0)',
              backgroundMode: 'color',
            },
            editor: {},
            watermark: {},
            theme: {},
            code: {},
            assets: {},
          }),
        )
      },
    })
    editorVisible()

    const pink = 'ff00ff'
    openColorPicker().find(`input[value="FF0000"]`).clear().type(`${pink}{enter}`)
    closePicker()

    cy.url().should('not.contain', 'bg=')
    cy.get('.container-bg .bg').should('have.css', 'background-color', 'rgb(255, 0, 255)')
  })

  it('selects a gradient and clears it when switching back to a color', () => {
    cy.visit('/')
    const darkRed = '#D0021B'
    const darkRedTile = `[title="${darkRed}"]`

    openPicker()
    cy.get('.bg-select-panel .ant-tabs-tab').eq(1).click()
    cy.get('[data-cy="background-gradient-item"][data-gradient-name="Warm Flame"]').click()

    cy.get('.container-bg .bg')
      .invoke('css', 'background-image')
      .should('match', /gradient/i)
    cy.get('.bg-color-container .bg-color')
      .invoke('css', 'background-image')
      .should('match', /gradient/i)

    cy.get('.bg-select-panel .ant-tabs-tab').eq(0).click()
    cy.get(picker).find(darkRedTile).click()
    closePicker()

    readEditorStorage().should(storage => {
      expect(storage.window.backgroundColor).to.eq('rgb(208, 2, 27)')
      expect(storage.window.backgroundGradient).to.eq(null)
      expect(storage.window.backgroundGradientBlendMode).to.eq(null)
    })
    cy.get('.container-bg .bg').should('have.css', 'background-color', 'rgb(208, 2, 27)')
  })
})
