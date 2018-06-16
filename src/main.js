const debug = require('debug')('dgmc')
const editor = require('./editor.js')
// use this title to locate this process
process.title = 'dgmc'

exports.run = function (host, port, eport) {
  let modules = ['pomodoro', 'session']
  modules.forEach(name => {
    let m = require(`./${name}`)
    m.bootstrap(editor)
  })

  let services = [
    {name: 'database', conf: {endpoint: 'localhost:50051'}},
    {name: 'pager', conf: {endpoint: 'localhost:50052'}}
  ]
  services.forEach(({name, conf}) => {
    let s = require(`./${name}`)
    s.connect(conf.endpoint)
    s.bootstrap(editor)
  })

  editor.listen(eport, () => {
    debug('Listening vim input on ' + eport)
  })
}
