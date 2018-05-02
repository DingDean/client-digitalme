const debug = require('debug')('digitme')
const zmq = require('zeromq')

module.exports = function ( path ) {
  const requester = zmq.socket('req')

  requester.on('message', reply => {
    debug("Received reply: [", reply.toString(), "]")
  })

  requester.connect( "tcp://localhost:5555" )
  return requester;
}
