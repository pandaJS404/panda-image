const { handleRandomImageDownloadRequest } = require('../bin/random-image-proxy')

module.exports = (req, res) => {
  req.url = req.url || '/api/random-image-download'
  return handleRandomImageDownloadRequest(req, res)
}
