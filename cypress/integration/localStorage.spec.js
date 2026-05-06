/* global cy */
import { clearEditorStorage, editorVisible, readEditorStorage } from '../support'

describe('localStorage', () => {
  const themeDropdown = () => cy.get('.toolbar .dropdown-container').first()
  const uiThemeToggle = () => cy.get('[data-cy="theme-toggle"]')
  const currentUiTheme = () => cy.document().its('documentElement.dataset.uiTheme')
  const pickTheme = (name = 'Blackboard') => themeDropdown().click().contains(name).click()

  beforeEach(() => {
    cy.clearLocalStorage()
    clearEditorStorage()
  })

  it('defaults to dark UI theme and persists separately from editor theme state', () => {
    cy.visit('/')
    editorVisible()

    currentUiTheme().should('eq', 'dark')
    uiThemeToggle().should('exist')
    cy.window().its('localStorage.PANDA_UI_THEME').should('eq', 'dark')

    pickTheme('Blackboard')
    cy.wait(1500) // URL updates are debounced

    uiThemeToggle().click()

    currentUiTheme().should('eq', 'light')

    readEditorStorage().should(storage => {
      expect(storage.theme.theme).to.eq('blackboard')
    })
  })

  it('creates the sectioned root storage shape on first load', () => {
    cy.visit('/')
    editorVisible()

    readEditorStorage().should(storage => {
      expect(storage).to.have.all.keys(
        'template',
        'window',
        'editor',
        'watermark',
        'theme',
        'code',
        'assets',
      )
      expect(storage.template).to.be.an('object')
      expect(storage.window).to.be.an('object')
      expect(storage.editor).to.be.an('object')
      expect(storage.watermark).to.be.an('object')
      expect(storage.theme).to.be.an('object')
      expect(storage.code).to.be.an('object')
      expect(storage.assets).to.be.an('object')
    })
  })

  it('restores the saved UI theme after refresh without changing route state', () => {
    cy.visit('/')
    editorVisible()

    pickTheme('Blackboard')
    cy.wait(1500) // URL updates are debounced

    uiThemeToggle().click()
    currentUiTheme().should('eq', 'light')
    cy.window().its('localStorage.PANDA_UI_THEME').should('eq', 'light')

    cy.reload()
    editorVisible()

    currentUiTheme().should('eq', 'light')
    readEditorStorage().should(storage => {
      expect(storage.theme.theme).to.eq('blackboard')
    })
  })

  it('restores non-default settings from IndexedDB storage', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            window: {
              windowTheme: 'bw',
            },
            editor: {},
            watermark: {},
            theme: {},
            code: {},
            template: {},
            assets: {},
          }),
        )
      },
    })
    editorVisible()

    readEditorStorage().should(storage => {
      expect(storage.window.windowTheme).to.eq('bw')
    })
    cy.get('.window-theme__bw').should('exist')
  })
})
