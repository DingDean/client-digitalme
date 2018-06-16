const debug = require('debug')('dgmc:pager')
const grpc = require('grpc')
const path = require('path')
const PROTO = path.resolve(__dirname,
  '../protos/pager.proto')
const Pager = grpc.load(PROTO).pager

let pager
function connect (endpoint) {
  pager = new Pager.PagerService(
    endpoint, grpc.credentials.createInsecure()
  )
  pager.waitForReady(Date.now() + 60000, err => {
    if (err)
      return debug('Failed to connect to remote pager service')

    debug('Connected to remote pager service')
  })
}

function bootstrap (server) {
  server.on('pong', () => {
    debug('pong')
    pager.ping(err => {
      if (err)
        debug(err)
    })
  })
}

exports.connect = connect
exports.bootstrap = bootstrap
