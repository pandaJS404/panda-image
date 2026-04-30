/* global cy */
import { editorVisible } from '../support'

describe('localStorage', () => {
  const themeDropdown = () => cy.get('.toolbar .dropdown-container').first()
  const uiThemeToggle = () => cy.get('[data-cy="theme-toggle"]')
  const currentUiTheme = () => cy.document().its('documentElement.dataset.uiTheme')
  const parseStoredSettings = win => JSON.parse(win.localStorage.PANDA_STATE)

  const pickTheme = (name = 'Blackboard') => themeDropdown().click().contains(name).click()

  beforeEach(() => {
    cy.clearLocalStorage()
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
    cy.url().should('contain', 't=blackboard').and('not.contain', 'uiTheme')

    cy.window().then(win => {
      expect(win.localStorage.PANDA_UI_THEME).to.eq('light')
      expect(JSON.parse(win.localStorage.PANDA_STATE).theme).to.eq('blackboard')
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
    cy.window().then(win => {
      expect(parseStoredSettings(win).theme).to.eq('blackboard')
    })
    cy.url().should('contain', 't=blackboard').and('not.contain', 'uiTheme')
  })

  it('restores non-default settings from plain JSON localStorage state', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_STATE',
          JSON.stringify({
            windowTheme: 'bw',
          }),
        )
      },
    })
    editorVisible()

    cy.window().then(win => {
      expect(parseStoredSettings(win).windowTheme).to.eq('bw')
    })
    cy.get('.window-theme__bw').should('exist')
  })

  it('restores non-default settings from legacy escaped localStorage state', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_STATE',
          '{&quot;windowTheme&quot;:&quot;bw&quot;,&quot;language&quot;:&quot;javascript&quot;}',
        )
      },
    })
    editorVisible()

    cy.window().then(win => {
      expect(parseStoredSettings(win)).to.deep.equal({
        windowTheme: 'bw',
        language: 'javascript',
      })
    })
    cy.get('.window-theme__bw').should('exist')
  })
})
