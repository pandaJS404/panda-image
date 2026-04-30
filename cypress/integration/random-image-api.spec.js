/* global cy */

describe('random image api cors', () => {
  const allowedOrigin = 'http://127.0.0.1:3000'
  const blockedOrigin = 'https://blocked.example.com'

  it('allows configured local development origin for preflight requests', () => {
    cy.request({
      url: '/api/random-image',
      method: 'OPTIONS',
      headers: {
        Origin: allowedOrigin,
      },
    }).then(response => {
      expect(response.status).to.eq(204)
      expect(response.headers['access-control-allow-origin']).to.eq(allowedOrigin)
      expect(response.headers.vary).to.eq('Origin')
    })
  })

  it('rejects disallowed origin for random image list', () => {
    cy.request({
      url: '/api/random-image',
      headers: {
        Origin: blockedOrigin,
      },
      failOnStatusCode: false,
    }).then(response => {
      expect(response.status).to.eq(403)
      expect(response.body).to.deep.equal({
        error: 'CORS_ORIGIN_NOT_ALLOWED',
      })
    })
  })

  it('rejects disallowed origin for random image download', () => {
    cy.request({
      url: '/api/random-image-download?id=bing-1',
      headers: {
        Origin: blockedOrigin,
      },
      failOnStatusCode: false,
    }).then(response => {
      expect(response.status).to.eq(403)
      expect(response.body).to.deep.equal({
        error: 'CORS_ORIGIN_NOT_ALLOWED',
      })
    })
  })

  it('allows configured local development origin for deterministic validation errors', () => {
    cy.request({
      url: '/api/random-image-download',
      headers: {
        Origin: allowedOrigin,
      },
      failOnStatusCode: false,
    }).then(response => {
      expect(response.status).to.eq(400)
      expect(response.headers['access-control-allow-origin']).to.eq(allowedOrigin)
      expect(response.body).to.deep.equal({
        error: 'RANDOM_IMAGE_ID_REQUIRED',
      })
    })
  })
})
