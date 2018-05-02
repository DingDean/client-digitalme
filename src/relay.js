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
  socket.__host = host
  socket.__port = port

  Gate = socket
}

function onConnect () {
  debug("Gateway to the main server is established")
  connected = true;
}

function onError () {
  debug('Remote Server Unaccessable, retry...')
  connected = false;
  this.destroy()
  setTimeout( () => {
    remoteConnect( this.__host, this.__port )
  }, process.env.RETRY_TIMEOUT || 10000 )
}

function onEnd ( ) {
  debug("Close the gateway")
  connected = false;
  this.destroy()
  setTimeout( () => {
    remoteConnect( this.__host, this.__port )
  }, process.env.RETRY_TIMEOUT || 10000 )
}
