const net = require('net')
const debug = require('debug')('digitme')
let Gate, connected;

module.exports = {
  getGate,
  remoteConnect
}

function getGate() {
  return connected ? Gate : null;
}

function remoteConnect ( host, port ) {
  if ( connected )
    return;
  let socket = net.createConnection( {host, port})
  socket.on('connect', onConnect.bind( socket ))
  socket.on('error', onError.bind( socket ))
  socket.on('end', onEnd.bind( socket ))

  Gate = socket
}

function onConnect () {
  debug("Gateway to the main server is established")
  connected = true;
}

function onError ( ) {
  debug('Remote Server Unaccessable, retry...')
  connected = false;
  this.destroy()
  setTimeout( remoteConnect, process.env.RETRY_TIMEOUT || 60000 )
}

function onEnd ( ) {
  debug("Close the gateway")
  connected = false;
  this.destroy()
  setTimeout( remoteConnect, process.env.RETRY_TIMEOUT || 60000 )
}
