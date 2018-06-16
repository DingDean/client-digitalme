const net = require('net')
const debug = require('debug')('editor')

let clientIndex = 0
let clients = []
const server = net.createServer(c => {
  c.id = `socket${clientIndex}`
  clientIndex++
  clients.push(c)
  c.setEncoding('utf8')

  c.on('data', msg => {
    if (!msg) return
    let index, message
    try {
      msg = JSON.parse(msg)
      index = msg[0]
      message = msg[1]
    } catch (e) {
      debug('收到无效的编辑器消息, error: ' + e)
      debug('消息为 ' + msg)
      return
    }
    let {event, ts, data} = message
    server.emit(event, ts, data, index, c)
  })

  c.on('close', () => {
    debug('editor client closed')
    clients = clients.filter(socket => socket.id !== c.id)
  })
})

server.on('error', err => {
  throw (new Error(err))
})

server.on('command', command => {
  clients.forEach(socket => {
    socket.write(command)
  })
})

module.exports = server
