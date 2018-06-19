const debug = require('debug')('dgmc')
const editor = require('./editor.js')
const serviceConf = require('../configs/services.js')
// use this title to locate this process
process.title = 'dgmc'

exports.run = function (host, port, eport) {
  let modules = ['pomodoro', 'session']
  modules.forEach(name => {
    let m = require(`./${name}`)
    m.bootstrap(editor)
  })

  serviceConf.forEach(({name, conf}) => {
    let s = require(`./${name}`)
    s.connect(conf.endpoint)
    s.bootstrap(editor)
  })

  editor.listen(eport, () => {
    debug('Listening vim input on ' + eport)
  })
}
