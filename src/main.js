// const relay = require('./relay.js')
const debug = require('debug')('dgmc')
const fs = require('fs')
const os = require('os')
const path = require('path')
const TEMP_DIR = path.resolve(os.homedir(), '.digitalme')
const editor = require('./editor.js')

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

// use this title to locate this process
process.title = 'dgmc'
exports.run = function (host, port, eport) {
  host = host || 'localhost'
  port = port || 8764
  eport = eport || 8763

  let modules = ['pomodoro', 'session']
  modules.forEach(name => {
    let m = require(`./${name}`)
    m.bootstrap(editor)
  })
  editor.listen(eport, () => {
    debug('Listening vim input on ' + eport)
  })

  // let sender = relay(`tcp://${host}:${port}`)
  // sender.on('flush_history', () => {
  //   fs.readdir(TEMP_DIR, (err, files) => {
  //     if (err) return debug('Failed to open temp dir')
  //     for (let name of files) {
  //       name = path.resolve(TEMP_DIR, name)
  //       fs.readFile(name, 'utf8', (err, buff) => {
  //         if (!err) {
  //           sender.send(buff)
  //           debug('A local history is sync to remote')
  //           fs.unlink(name, err => {
  //             if (err) debug(`Error on deleting temp file ${name}`)
  //           })
  //         }
  //       })
  //     }
  //   })
  // })

  process.on('SIGINT', () => {
    // sender.close()
    process.exit()
  })

  // setInterval(() => {
  //   // TODO: 2018-05-06
  //   // gzip the history
  //   let history = Session.history
  //     .filter(e => e.validate())
  //   Session.history = []

  //   let tomatos = tomato.history
  //   tomato.history = []
  //   if (history.length === 0 && tomatos.length === 0) return

  //   let msg = {
  //     event: 'digit_session',
  //     data: { ts: Date.now(), history, tomatos }
  //   }
  //   msg = JSON.stringify(msg)

  //   if (sender.isAlive()) {
  //     sender.send(msg)
  //     debug('History is synced to remote server')
  //   } else {
  //     let fp = path.resolve(TEMP_DIR, `./${Date.now()}_tmp`)
  //     fs.writeFile(fp, msg, err => {
  //       if (err) return debug('Failed to save history locally: ' + err)
  //       debug('History is saved locally')
  //     })
  //   }
  // }, 30000)
}
