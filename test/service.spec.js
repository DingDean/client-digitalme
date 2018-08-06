const svs = require('../src/service')
const nock = require('nock')
const assert = require('assert')

describe('service#init auth with remote server', function () {
  describe('when auth is rejected', function () {
    before(function () {
      nock('http://localhost:8999')
        .post('/auth')
        .reply(401)
    })
    it('should abort', function (done) {
      svs
        .init('http://localhost:8999', 'wrong token')
        .then(done)
        .catch(e => {
          assert(e)
          done()
        })
    })
  })
})
