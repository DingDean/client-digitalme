const debug = require('debug')('digitme')
module.exports = function ( sender, message ) {
  let { event, data } = message
  if ( event == "ping" ) {// pass through handler
    message = JSON.stringify(message)
    debug('sending ' + message)
    sender.write( message )
  }
}
