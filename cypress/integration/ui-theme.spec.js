/* global cy */
import { editorVisible } from '../support'

describe('UI theme shell smoke', () => {
  const themeDropdown = () => cy.get('.toolbar .dropdown-container').first()
  const languageDropdown = () => cy.get('.toolbar .toolbar-group--leading > .dropdown-container').first()
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
    themeDropdown().should('have.attr', 'aria-tooltip')
    languageDropdown().should('have.attr', 'aria-tooltip')
    cy.get('.theme-toggle__switch-shell').should('have.attr', 'aria-tooltip')

    themeDropdown().trigger('mouseenter', { force: true })
    cy.get('.theme-toggle__switch-shell').trigger('mouseenter', { force: true })
    cy.get('.ant-tooltip').should('not.exist')

    pickTheme('Cobalt')
    cy.wait(1500) // URL updates are debounced

    themeDropdown().click()
    cy.get('.dropdown-list-popup').should('be.visible')
    cy.contains('[data-cy="dropdown-item"]', 'Cobalt').click()

    settingsButton().click()
    cy.get('.settings-modal').should('be.visible')
    cy.get('.settings-modal .ant-slider').should('exist')
    cy.get('.settings-modal .slider-control').should('not.exist')
    cy.get('.settings-modal .ant-modal-close').click()

    uiThemeToggle().click()

    cy.document().its('documentElement.dataset.uiTheme').should('eq', 'light')

    themeDropdown().click()
    cy.get('.dropdown-list-popup').should('be.visible')
    cy.contains('[data-cy="dropdown-item"]', 'Cobalt').click()

    settingsButton().click()
    cy.get('.settings-modal').should('be.visible')
    cy.get('.settings-modal .ant-slider').should('exist')
    cy.get('.settings-modal .slider-control').should('not.exist')

    cy.window().then(win => {
      expect(JSON.parse(win.localStorage.PANDA_STATE).theme).to.eq('cobalt')
    })

    cy.url().should('contain', 't=cobalt').and('not.contain', 'uiTheme')
  })
})
