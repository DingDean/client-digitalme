#!/usr/bin/env node

const relay = require('./src/relay.js')
const Session = require('./src/session.js')
const program = require('commander')
const debug = require('debug')('digitme')
const net = require('net')
const fs = require('fs')
const os = require('os')
const path = require('path')
const TEMP_DIR = path.resolve( os.homedir(), '.digitalme' )

try {
  fs.readdirSync( TEMP_DIR )
  debug('TEMP DIR exists, safe to go')
} catch (e) {
  try {
    fs.mkdirSync( TEMP_DIR )
    debug('TEMP DIR is created')
  } catch (e) {
    throw(e)
  }
}

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
sender.on('flush_history', () => {
  fs.readdir( TEMP_DIR, (err, files) => {
    if (err)
      return debug('Failed to open temp dir')
    for (let name of files) {
      name = path.resolve( TEMP_DIR, name )
      fs.readFile( name, 'utf8', (err, buff) =>{
        if ( !err ) {
          sender.send( buff )
          debug('A local history is sync to remote')
          fs.unlink( name, err => {
            if (err)
              debug(`Error on deleting temp file ${name}`)
          })
        }
      })
    }
  })
})

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
  if ( sender.isAlive() ) {
    let msg = JSON.stringify({event: 'digit_ping'})
    sender.send( msg )
  }
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

setInterval(() => {
  // TODO: 2018-05-06
  // gzip the history
  let history = Session.history
    .filter( e => e.validate())
  if ( history.length == 0 )
    return
  Session.history = []

  let msg = {event: 'digit_session', data: {ts: Date.now(), history}}
  msg = JSON.stringify(msg)

  if ( sender.isAlive() ) {
    sender.send( msg )
    debug('History is synced to remote server')
  } else {
    let fp = path.resolve( TEMP_DIR, `./${Date.now()}_tmp` )
    fs.writeFile(fp, msg, err => {
      if ( err )
        return debug('Failed to save history locally: ' + err)
      debug('History is saved locally')
    })
  }
}, 30000)
