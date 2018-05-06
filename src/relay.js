const debug = require('debug')('digitme')
const zmq = require('zeromq')

module.exports = function ( path ) {
  const requester = zmq.socket('push')
  requester.__alive = false

  requester.isAlive = function () {
    return requester.__alive
  }

  requester.on('connect', () => {
    debug('Connected to remote server: ' + path)
    requester.__alive = true
  })

  requester.on('close', () => {
    debug('Socket is closed')
    requester.__alive = false
  })

  requester.on('disconnect', () => {
    debug('Socket is disconnected')
    requester.__alive = false
  })

  requester.on('accept_error', err => {
    debug('accept error: ' + err)
  })

  requester.on('error', err => {
    debug('Error with zeromq' + err)
  } )

  requester.on('monitor_error', err => {
    debug("Monitor catch error" + err)
  })

  requester.connect( path ).monitor()
  return requester;
}
