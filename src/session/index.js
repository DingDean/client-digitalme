const Session = require('./session.js')
const debug = require('debug')('dgmc:session')

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
    server.emit('ping')
  })

  server.on('bufEnter', (ts, data) => {
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
    let current = Session.current

    if (!current) return debug('Possible bug, no session when a bufleave')
    current.close(data)
    Session.stash(current)
  })

  server.on('bufLeave', (ts, data) => {
    let current = Session.current

    if (!current) return debug('Possible bug, no session when a bufleave')
    current.close(data)
    Session.stash(current)
  })

  return server
}
