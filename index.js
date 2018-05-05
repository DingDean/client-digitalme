#!/usr/bin/env node

const relay = require('./src/relay.js')
const Session = require('./src/session.js')
//const handle = require('./src/handler.js')
const program = require('commander')
const debug = require('debug')('digitme')
const net = require('net')

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

const editorListener = net.createServer( c => {
  c.setEncoding( 'utf8' )
  c.on('data', msg => {
    if (!msg)
      return
    let index, message
    try {
      let [i, m] = JSON.parse(msg)
      index = i
      message = m
    } catch (e) {
      debug('收到无效的编辑器消息, error: ' + e)
      debug('消息为 ' + msg)
      return
    }
    let {event, ts, data} = message
    editorListener.emit( event, ts, data )
  })
})

editorListener.on('error', err => {
  throw(new Error(err))
})

editorListener.on('ping', ( ts, data ) => {
  let current = Session.current
  if (current) {
    if (current.isExpired( ts )) {
      current.close()
      Session.stash( current )
      let {filename, filetype} = current
      let s = Session.new( filename, filetype )
      Session.current = s
    } else {
      current.beat()
    }
  }
  else {
    // this might happen when client is restarted
    let s = Session.new('', '')
    s.marked = true
    Session.current = s
    debug(`A marked session is created with index ${s.index}`)
  }
  // TODO: sender
})

editorListener.on('bufEnter', ( ts, data ) => {
  let {filename='test', filetype='test'} = data
  let current = Session.current
  if ( current ) {
    if ( current.isClosed() ) {
      // do nothing
    } else if ( current.isExpired( ts ) ) {
      current.close()
      Session.stash( current )
    } else {
      debug('Possible bug, create new session when old one is not closed')
    }
  }
  let s = Session.new(filename, filetype)
  Session.current = s
})

editorListener.on('bufLeave', (ts, data) => {
  let current = Session.current

  if ( !current )
    return debug('Possible bug, no session when a bufleave')
  current.close( data )
  Session.stash( current )
})

editorListener.listen( eport, () => {
  debug("Listening vim input on " + port)
})

process.on('SIGINT', () => {
  sender.close()
  process.exit()
})
