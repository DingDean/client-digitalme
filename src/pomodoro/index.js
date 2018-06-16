const {Pomodoro} = require('./pomodoro.js')
const debug = require('debug')('dgmc:pomodoro')

function newMgr (server) {
  const tomato = new Pomodoro()
  tomato.add({name: 'default'})
  tomato.on('finish', (history) => {
    // TODO: 2018-05-22
    // Query for afterthought
    debug('a timer is finished')
    let msg = JSON.stringify(['ex', 'call digitme#tomatoFinish()'])
    server.emit('command', msg)
    server.emit('save tomato', history)
  })

  tomato.on('change', () => {
    let {state, tEnd} = tomato.getState()
    let msg = JSON.stringify([
      'ex',
      `call digitme#tomatoStateSync(${state}, ${tEnd})`
    ])
    debug(`state change to ${state}`)
    server.emit('command', msg)
  })
  return tomato
}

exports.bootstrap = function (server) {
  let tomato = newMgr(server)
  server.on('tomatoQuery', (ts, data, index, client) => {
    debug('tomatoQuery')
    client.write(JSON.stringify([index, tomato.getState()]))
  })

  server.on('tomatoStart', (ts, data, index, client) => {
    debug('tomatoStart')
    debug(data)
    let {name = 'default'} = data
    let msg = [index, {ok: 0, err: ''}]
    let err = tomato.start(name)
    if (err) {
      msg[1].ok = 1
      msg[1].err = err
    }
    debug(err || 'timer started')
    client.write(JSON.stringify(msg))
  })

  server.on('tomatoPause', (ts, data, index, client) => {
    debug('tomatoPause')
    let msg = [index, {ok: 0, err: ''}]
    let err = tomato.pause()
    if (err) {
      msg[1].ok = 1
      msg[1].err = err
    }
    debug(err || 'timer paused')
    client.write(JSON.stringify(msg))
  })

  server.on('tomatoAbandon', (ts, data, index, client) => {
    debug('tomatoAbandon')
    let msg = [index, {ok: 0, err: ''}]
    let err = tomato.abandon()
    if (err) {
      msg[1].ok = 1
      msg[1].err = err
    }
    debug(err || 'timer abandoned')
    client.write(JSON.stringify(msg))
  })

  server.on('tomatoResume', (ts, data, index, client) => {
    debug('tomatoResume')
    let msg = [index, {ok: 0}]
    let err = tomato.resume()
    if (err) {
      msg[1].ok = 1
      msg[1].err = err
    }
    client.write(JSON.stringify(msg))
    debug(err || 'timer resumed')
  })
}
