const sinon = require('sinon')
const assert = require('assert')
const server = require('../../src/lib/editor')
const nock = require('nock')

describe('onSaveTomato', function () {
  describe('when network is ok', function () {
    beforeEach(function () {
      nock('http://localhost:8999')
        .post('/pomodoro')
        .reply(200, 'ok')
    })

    it('should send the tomatoes to remote server', function () {
    })
  })
})
