/* global cy */
import {
  clearEditorStorage,
  editorVisible,
  readEditorStorage,
  writeEditorStorage,
} from '../support'

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

  it('migrates legacy PANDA_STATE neumorphism fields into the window section', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_STATE',
          JSON.stringify({
            neumorphismEnabled: true,
            neumorphismColor: '#55b9f3',
            neumorphismShape: 'convex',
            neumorphismLightSource: 'top-right',
            neumorphismDistance: 24,
            neumorphismBlur: 48,
            neumorphismIntensity: 0.22,
            neumorphismRadius: 20,
          }),
        )
      },
    })
    editorVisible()

    readEditorStorage().should(storage => {
      expect(storage.window).to.include({
        neumorphismEnabled: true,
        neumorphismColor: '#55b9f3',
        neumorphismShape: 'convex',
        neumorphismLightSource: 'top-right',
        neumorphismDistance: 24,
        neumorphismBlur: 48,
        neumorphismIntensity: 0.22,
        neumorphismRadius: 20,
      })
      expect(storage).not.to.have.property('neumorphismEnabled')
      expect(storage).not.to.have.property('neumorphismColor')
    })
    cy.window().its('localStorage.PANDA_STATE').should('be.undefined')
  })

  it('normalizes flat PANDA_EDITOR_STORAGE neumorphism fields into the window section', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            neumorphismEnabled: true,
            neumorphismColor: '#55b9f3',
            neumorphismShape: 'flat',
            neumorphismLightSource: 'bottom-left',
            neumorphismDistance: 16,
            neumorphismBlur: 32,
            neumorphismIntensity: '0.18',
            neumorphismRadius: 14,
          }),
        )
      },
    })
    editorVisible()

    readEditorStorage().should(storage => {
      expect(storage.window).to.include({
        neumorphismEnabled: true,
        neumorphismColor: '#55b9f3',
        neumorphismShape: 'flat',
        neumorphismLightSource: 'bottom-left',
        neumorphismDistance: 16,
        neumorphismBlur: 32,
        neumorphismIntensity: '0.18',
        neumorphismRadius: 14,
      })
      expect(storage).not.to.have.property('neumorphismEnabled')
      expect(storage).not.to.have.property('neumorphismColor')
    })
    cy.window().its('localStorage.PANDA_EDITOR_STORAGE').should('be.undefined')
  })

  it('keeps sectioned neumorphism fields when normalizing mixed legacy storage', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            neumorphismShape: 'flat',
            neumorphismColor: '#e0e0e0',
            window: {
              neumorphismEnabled: true,
              neumorphismColor: '#55b9f3',
              neumorphismShape: 'pressed',
              neumorphismRadius: 22,
            },
          }),
        )
      },
    })
    editorVisible()

    readEditorStorage().should(storage => {
      expect(storage.window).to.include({
        neumorphismEnabled: true,
        neumorphismColor: '#55b9f3',
        neumorphismShape: 'pressed',
        neumorphismRadius: 22,
      })
      expect(storage.window.neumorphismColor).not.to.eq('#e0e0e0')
      expect(storage.window.neumorphismShape).not.to.eq('flat')
    })
    cy.get('.panda-container').should('have.attr', 'data-neumorphism-enabled')
    cy.get('.panda-container').should('have.attr', 'data-neumorphism-shape', 'pressed')
    cy.get('.CodeMirror__container > .CodeMirror')
      .invoke('css', 'box-shadow')
      .should('contain', 'inset')
    cy.get('.CodeMirror__container > .CodeMirror')
      .invoke('css', 'border-radius')
      .should('eq', '22px')
  })

  it('normalizes existing IndexedDB flat root neumorphism fields on read', () => {
    cy.visit('/')
    editorVisible()

    writeEditorStorage({
      neumorphismEnabled: true,
      neumorphismColor: '#55b9f3',
      neumorphismShape: 'concave',
      neumorphismLightSource: 'bottom-right',
      neumorphismDistance: 28,
      neumorphismBlur: 52,
      neumorphismIntensity: 0.24,
      neumorphismRadius: 26,
    })

    cy.reload()
    editorVisible()

    readEditorStorage().should(storage => {
      expect(storage.window).to.include({
        neumorphismEnabled: true,
        neumorphismColor: '#55b9f3',
        neumorphismShape: 'concave',
        neumorphismLightSource: 'bottom-right',
        neumorphismDistance: 28,
        neumorphismBlur: 52,
        neumorphismIntensity: 0.24,
        neumorphismRadius: 26,
      })
      expect(storage).not.to.have.property('neumorphismEnabled')
      expect(storage).not.to.have.property('neumorphismColor')
    })
  })

  it('turns off conflicting window effects and disables their controls when enabling neumorphism', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {
              codeMirrorBorder: true,
              codeMirrorBorderRadius: '20px',
              dropShadow: true,
              glassEffect: true,
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

    cy.get('[data-cy="settings-button"]').click()
    cy.get('.settings-modal').should('be.visible')
    cy.contains('.settings-tabs .ant-tabs-tab', '拟态').click()
    cy.contains('.settings-tabs .ant-tabs-tabpane-active .toggle', '启用拟态')
      .find('.ant-switch')
      .click()
    cy.wait(1000)

    readEditorStorage().should(storage => {
      expect(storage.window.neumorphismEnabled).to.eq(true)
      expect(storage.window.codeMirrorBorder).to.eq(false)
      expect(storage.window.dropShadow).to.eq(false)
      expect(storage.window.glassEffect).to.eq(false)
      expect(storage.window.codeMirrorBorderRadius).to.eq('20px')
    })

    cy.contains('.settings-tabs .ant-tabs-tab', '窗口').click()
    cy.contains('.settings-tabs .ant-tabs-tabpane-active .toggle', '编辑器边框')
      .should('have.attr', 'data-disabled', 'true')
      .find('.ant-switch')
      .should('be.disabled')
    cy.contains('.settings-tabs .ant-tabs-tabpane-active .toggle', '投影')
      .should('have.attr', 'data-disabled', 'true')
      .find('.ant-switch')
      .should('be.disabled')
    cy.contains('.settings-tabs .ant-tabs-tabpane-active .toggle', '毛玻璃')
      .should('have.attr', 'data-disabled', 'true')
      .find('.ant-switch')
      .should('be.disabled')
    cy.contains('.settings-tabs .ant-tabs-tabpane-active .settings-slider-row', '圆角')
      .should('have.attr', 'data-disabled', 'true')
      .find('.ant-slider-disabled')
      .should('exist')
  })

  it('does not restore conflicting effects after disabling neumorphism', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {
              codeMirrorBorder: true,
              dropShadow: true,
              glassEffect: true,
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

    cy.get('[data-cy="settings-button"]').click()
    cy.get('.settings-modal').should('be.visible')
    cy.contains('.settings-tabs .ant-tabs-tab', '拟态').click()
    cy.contains('.settings-tabs .ant-tabs-tabpane-active .toggle', '启用拟态')
      .find('.ant-switch')
      .click()
    cy.contains('.settings-tabs .ant-tabs-tabpane-active .toggle', '启用拟态')
      .find('.ant-switch')
      .click()
    cy.wait(1000)

    readEditorStorage().should(storage => {
      expect(storage.window.neumorphismEnabled).to.eq(false)
      expect(storage.window.codeMirrorBorder).to.eq(false)
      expect(storage.window.dropShadow).to.eq(false)
      expect(storage.window.glassEffect).to.eq(false)
    })
  })

  it('cleans up conflicting effects when restoring already-enabled neumorphism storage', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {
              neumorphismEnabled: true,
              codeMirrorBorder: true,
              dropShadow: true,
              glassEffect: true,
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
    cy.wait(1000)

    readEditorStorage().should(storage => {
      expect(storage.window.neumorphismEnabled).to.eq(true)
      expect(storage.window.codeMirrorBorder).to.eq(false)
      expect(storage.window.dropShadow).to.eq(false)
      expect(storage.window.glassEffect).to.eq(false)
    })
  })

  it('shows Chinese neumorphism radio labels while preserving semantic values', () => {
    cy.visit('/')
    editorVisible()

    cy.get('[data-cy="settings-button"]').click()
    cy.get('.settings-modal').should('be.visible')
    cy.contains('.settings-tabs .ant-tabs-tab', '拟态').click()

    ;['平面', '内凹', '外凸', '按下', '左上', '右上', '右下', '左下'].forEach(label => {
      cy.contains(
        '.settings-tabs .ant-tabs-tabpane-active .ant-radio-button-wrapper',
        label,
      ).should('exist')
    })

    cy.contains('.settings-tabs .ant-tabs-tabpane-active .ant-radio-button-wrapper', '按下').click()
    cy.contains('.settings-tabs .ant-tabs-tabpane-active .ant-radio-button-wrapper', '右下').click()
    cy.wait(1000)

    readEditorStorage().should(storage => {
      expect(storage.window.neumorphismShape).to.eq('pressed')
      expect(storage.window.neumorphismLightSource).to.eq('bottom-right')
    })
  })

  it('restores and persists neumorphism settings in the window section', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {
              neumorphismEnabled: true,
              neumorphismColor: '#e0e0e0',
              neumorphismShape: 'pressed',
              neumorphismLightSource: 'bottom-right',
              neumorphismDistance: 18,
              neumorphismBlur: 36,
              neumorphismIntensity: '0.2',
              neumorphismRadius: 18,
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

    cy.get('.panda-container').should('have.attr', 'data-neumorphism-enabled')
    cy.get('.panda-container').should('have.attr', 'data-neumorphism-shape', 'pressed')
    cy.get('.CodeMirror__container > .CodeMirror')
      .invoke('css', 'box-shadow')
      .should('contain', 'inset')
    cy.get('.CodeMirror__container > .CodeMirror')
      .invoke('css', 'border-radius')
      .should('eq', '18px')

    cy.get('[data-cy="settings-button"]').click()
    cy.get('.settings-modal').should('be.visible')
    cy.contains('.settings-tabs .ant-tabs-tab', '拟态').click()
    cy.contains('.settings-tabs .ant-tabs-tabpane-active .toggle', '启用拟态')
      .find('.ant-switch')
      .click()
    cy.wait(1000)

    readEditorStorage().should(storage => {
      expect(storage.window.neumorphismEnabled).to.eq(false)
      expect(storage.window.neumorphismShape).to.eq('pressed')
      expect(storage.window.neumorphismLightSource).to.eq('bottom-right')
    })
  })

  it('exports neumorphism settings inside the window section', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {
              neumorphismEnabled: true,
              neumorphismColor: '#55b9f3',
              neumorphismShape: 'convex',
              neumorphismLightSource: 'top-left',
              neumorphismDistance: 30,
              neumorphismBlur: 44,
              neumorphismIntensity: 0.2,
              neumorphismRadius: 24,
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

    cy.get('[data-cy="settings-button"]').click()
    cy.get('.settings-modal').should('be.visible')
    cy.contains('.settings-tabs .ant-tabs-tab', '杂项').click()

    cy.contains('.settings-tabs .ant-tabs-tabpane-active .settings-link-button', '导出配置')
      .invoke('attr', 'href')
      .then(href => {
        const decoded = JSON.parse(
          decodeURIComponent(href.replace('data:text/json;charset=utf-8,', '')),
        )

        expect(decoded.window).to.include({
          neumorphismEnabled: true,
          neumorphismColor: '#55b9f3',
          neumorphismShape: 'convex',
          neumorphismLightSource: 'top-left',
          neumorphismDistance: 30,
          neumorphismBlur: 44,
          neumorphismIntensity: 0.2,
          neumorphismRadius: 24,
        })
      })
  })
})
