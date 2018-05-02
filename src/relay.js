const debug = require('debug')('digitme')
const zmq = require('zeromq')

module.exports = function ( path ) {
  const requester = zmq.socket('req')

  requester.on('message', reply => {
    debug("Received reply: [", reply.toString(), "]")
  })

  debug('Connectiong to remote server: ' + path)
  requester.connect( path )
  return requester;
}
