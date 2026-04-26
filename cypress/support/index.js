/* global cy */
export const editorVisible = () => cy.get('.editor').should('be.visible')
