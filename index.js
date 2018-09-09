const program = require('commander')
const main = require('./src/main.js')

program
  .option('--host <host>', 'remote server host')
  .option('--eport <eport>', 'local editor channel port', parseInt)
  .option('--apiToken <apiToken>', 'your apiToken')
  .parse(process.argv)

let {host, eport, apiToken} = program

if (!apiToken)
  throw new Error('apiToken NOT FOUND')

host = host || 'localhost:8999'
eport = eport || 8763

main.run(host, eport, apiToken)
