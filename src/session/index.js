const Session = require('./session.js')
const debug = require('debug')('dgmc:sessionMgr')
const HALF_HOUR = 30 * 60000

exports.bootstrap = function (server) {
  server.on('ping', (ts, data) => {
    let current = Session.current
    if (current) {
      if (current.isExpired(ts)) {
        current.close()
        Session.stash(current)
        let {filename, filetype} = current
        let s = Session.new(filename, filetype)
        Session.current = s
      } else
        current.beat()
    } else {
      // this might happen when client is restarted
      let s = Session.new('', '')
      s.marked = true
      Session.current = s
      debug(`A marked session is created with index ${s.index}`)
    }
    debug('ping')
    server.emit('pong')
  })

  server.on('bufEnter', (ts, data) => {
    debug('bufEnter')
    let {filename = 'test', filetype = 'test'} = data
    let current = Session.current
    if (current) {
      if (current.isClosed()) {
        // do nothing
      } else {
        current.close()
        Session.stash(current)
      }
    }
    let s = Session.new(filename, filetype)
    Session.current = s
  })

  server.on('bufLeave', (ts, data) => {
    debug('bufLeave')
    let current = Session.current

    if (!current) return debug('Possible bug, no session when a bufleave')
    current.close(data)
    Session.stash(current)
  })

  setInterval(() => {
    let history = Session.history
      .filter(e => e.validate())
    Session.history = []
    debug('session created')
    debug(history)
    server.emit('save session', history)
  }, 30000)

  return server
}
