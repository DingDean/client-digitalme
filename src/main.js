const debug = require('debug')('dgmc')
const editor = require('./editor.js')
const database = require('./database.js')

// use this title to locate this process
process.title = 'dgmc'

exports.run = function (host, port, eport) {
  host = host || 'localhost'
  port = port || 8764
  eport = eport || 8763

  database.connect(`${host}:${port}`)
  database.bootstrap(editor)

  let modules = ['pomodoro', 'session']
  modules.forEach(name => {
    let m = require(`./${name}`)
    m.bootstrap(editor)
  })

  editor.listen(eport, () => {
    debug('Listening vim input on ' + eport)
  })
}
