/* global cy */
import { editorVisible } from '../support'

describe('UI theme shell smoke', () => {
  const themeDropdown = () => cy.get('.toolbar .dropdown-container').first()
  const uiThemeToggle = () => cy.get('[data-cy="theme-toggle"]')
  const settingsButton = () => cy.get('[data-cy="settings-button"]')

  const pickTheme = (name = 'Cobalt') =>
    themeDropdown()
      .click()
      .contains(name)
      .click()

  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('adapts toolbar and settings shell surfaces without changing the selected code theme', () => {
    cy.visit('/')
    editorVisible()

    uiThemeToggle().should('exist')

    pickTheme('Cobalt')
    cy.wait(1500) // URL updates are debounced

    themeDropdown().click()
    cy.get('.dropdown-list-popup').should('be.visible')
    cy.contains('[data-cy="dropdown-item"]', 'Cobalt').click()

    settingsButton().click()
    cy.get('.settings-popover').should('be.visible')
    settingsButton().click()

    uiThemeToggle().click()

    cy.document().its('documentElement.dataset.uiTheme').should('eq', 'light')

    themeDropdown().click()
    cy.get('.dropdown-list-popup').should('be.visible')
    cy.contains('[data-cy="dropdown-item"]', 'Cobalt').click()

    settingsButton().click()
    cy.get('.settings-popover').should('be.visible')

    cy.window().then(win => {
      expect(JSON.parse(win.localStorage.PANDA_STATE).theme).to.eq('cobalt')
    })

    cy.url().should('contain', 't=cobalt').and('not.contain', 'uiTheme')
  })
})
