const editor = require('./lib/editor')
const service = require('./service')
const debug = require('debug')('dgmc')
// use this title to locate this process
process.title = 'dgmc'

exports.run = async function (host, eport, apiToken) {
  try {
    await service.init(host, apiToken)
  } catch (e) {
    console.log(e)
    process.abort()
  }

  let modules = ['pomodoro', 'session', 'database']
  modules.forEach(name => {
    let m = require(`./events/${name}`)
    m.bootstrap(editor)
  })

  editor.listen(eport, () => {
    debug('Listening vim input on ' + eport)
  })
}
