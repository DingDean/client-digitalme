#!/usr/bin/env node

const program = require('commander')
const debug = require('debug')('digitme')
const editorListener = require('./src/editorListen.js');
const relay = require('./src/relay.js')
const handle = require('./src/handler.js')

program
  .description( 'cli tool for digitalme' )
  .option('--host <host>', 'remote server host')
  .option('--port <port>', 'remote server port')
  .option('--eport <eport>', 'local editor channel port')
  .parse( process.argv )

let { host, port, eport } = program

host = host || "localhost"
port = port || 8764
eport = eport || 8763

let sender = relay( `tcp://${host}:${port}` )
editorListener.listen( eport, msg => {
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
  sender.send( JSON.stringify( message ), 0, err => {
    if (err) debug("Failed to relay" + err)
  } )
})

process.on('SIGINT', () => {
  sender.close()
  process.exit()
})
