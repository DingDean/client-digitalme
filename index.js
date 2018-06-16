const program = require('commander')
const main = require('./src/main.js')

program
  .option('--host <host>', 'remote server host')
  .option('--port <port>', 'remote server port', parseInt)
  .option('--eport <eport>', 'local editor channel port', parseInt)
  .parse(process.argv)

let {host, port, eport} = program

host = host || 'localhost'
port = port || 50051
eport = eport || 8763

main.run(host, port, eport)
