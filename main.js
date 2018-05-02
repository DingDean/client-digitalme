const path = require('path')
const net = require('net')
const debug = require('debug')('digitme')
require('dotenv').config()
const handle = require('./handler.js')

let Gate, connected = false;

const Editor = net.createServer( c => {
  c.setEncoding('utf8')
  c.on('data', msg => {
    if (!msg)
      return
    let index, message
    try {
      let [i, m] = JSON.parse(msg)
      index = i
      message = m
    } catch (e) {
      debug('收到无效的编辑器消息')
    }
    if ( connected )
      handle( Gate, message )
    else
      remoteConnect()
  })
  c.on('close', () => {
    debug("a vim instance closed")
  })
} )

Editor.on('error', err => {
  throw(new Error(err))
})

Editor.listen(process.env.EDITOR_PORT, () => {
  debug("Listening vim input on 8763")
  remoteConnect()
})

function remoteConnect () {
  let socket = net.createConnection(
    {host: process.env.REMOTE_HOST, port: process.env.REMOTE_PORT}
  )
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
  setTimeout( remoteConnect, process.env.RETRY_TIMEOUT | 60000 )
}

function onEnd ( ) {
  debug("Close the gateway")
  connected = false;
  this.destroy()
}
