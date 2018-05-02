const net = require('net')
const debug = require('debug')('digitme')

exports.listen = function ( port, onData ) {
  const Editor = net.createServer( c => {
    c.setEncoding('utf8')
    c.on('data', onData)
  })

  Editor.on('error', err => {
    throw(new Error(err))
  })

  Editor.listen( port, () => {
    debug("Listening vim input on " + port)
  })
}
