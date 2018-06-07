const debug = require('debug')('dgmc:db')
const grpc = require('grpc')
const path = require('path')
const PROTO = path.resolve(__dirname,
  '../protos/database/database.proto')
const database = grpc.load(PROTO).database

const os = require('os')
const fs = require('fs')
const TEMP_DIR = path.resolve(os.homedir(), '.digitalme')

let db
let useLocal = true

function connect (endpoint) {
  try {
    fs.readdirSync(TEMP_DIR)
    debug('TEMP DIR exists, safe to go')
  } catch (e) {
    try {
      fs.mkdirSync(TEMP_DIR)
      debug('TEMP DIR is created')
    } catch (e) {
      throw (e)
    }
  }

  db = new database.DbService(
    endpoint, grpc.credentials.createInsecure()
  )
  db.waitForReady(Date.now() + 60000, err => {
    if (err)
      return debug('Failed to connect to remote database, fallback to local')

    flushHistory()
  })
}

function flushHistory () {
  useLocal = false

  fs.readdir(TEMP_DIR, (err, files) => {
    if (err) return debug('Failed to open temp dir')
    files
      .filter(f => f.match(/_sessions$/))
      .forEach(name => {
        name = path.resolve(TEMP_DIR, name)
        fs.readFile(name, 'utf8', (err, buff) => {
          if (!err) {
            saveRemote(buff)
            debug('A local history is sync to remote')

            fs.unlink(name, err => {
              if (err) debug(`Error on deleting temp file ${name}`)
            })
          }
        })
      })
  })
}

function bootstrap (server) {
  server.on('save session', onSaveSession)
}

function onSaveSession (sessions) {
  let length = sessions.length
  if (length === 0)
    return

  let history = sessions.map(e => {
    let fields = ['index', 'marked']
    return copyWithoutFields(e, fields)
  })

  if (useLocal)
    saveLocal(history)
  else
    saveRemote(history)
}

function copyWithoutFields (original, fields) {
  let keysToCopy = Object.keys(original).filter(e => !fields.find(e))
  let trimed = {}
  keysToCopy.forEach(key => {
    trimed[key] = original[key]
  })
  return trimed
}

let failedAttempts = []
function saveLocal (sessions) {
  let fp = path.resolve(TEMP_DIR, `./${Date.now()}_tmp_sessions`)

  try {
    let serial = JSON.stringify(sessions)
    fs.writeFile(fp, serial, err => {
      if (err) return debug('Failed to save history locally: ' + err)
      debug('History is saved locally')
    })
  } catch (e) {
    debug('Failed to save history locally: ' + e)
    failedAttempts.push(sessions)
  }
}

function saveRemote (sessions) {
  if ((typeof sessions) === 'string') {
    try {
      sessions = JSON.parse(sessions)
    } catch (e) {
      debug('failed to recover sessions' + e)
    }
  }
  db.saveSession(sessions, (err, msg) => {
    if (err)
      return debug(err)
    let {statusCode, status} = msg

    if (statusCode !== 0)
      debug(status)
  })
}

exports.connect = connect

exports.bootstrap = bootstrap
