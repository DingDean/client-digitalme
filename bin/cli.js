#!/usr/bin/env node

const program = require('commander')
const findp = require('find-process')
const path = require('path')
const main = path.resolve(__dirname, '../index.js')
const {spawn} = require('child_process')
const process = require('process')

const daemon = function (host, port, eport) {
  let cmd = 'nohup'
  let argv = [
    'node',
    main,
    `--host ${host}`,
    `--port ${port}`,
    `--eport ${eport}`,
    '&>',
    '/dev/null',
    '&'
  ]

  let sp = spawn(cmd, argv, {
    detached: true,
    stdio: 'ignore'
  })

  sp.on('error', err => {
    throw (new Error(err.stack || err))
  })

  sp.unref()
}

const isRunning = async function (name) {
  let list = await findp('name', name)
  let running = list.length !== 0
  return {running, list}
}

const portIsFree = async function (port) {
  let list = await findp('port', port)
  return list.length === 0
}

program
  .command('start')
  .option('--host <host>', 'remote server host, default: localhost')
  .option('--port <port>', 'remote server port, default: 8764', parseInt)
  .option('--eport <eport>',
    'local editor channel port, default: 8763', parseInt)
  .action(async options => {
    let {host, port, eport} = program

    host = host || 'localhost'
    port = port || 8764
    eport = eport || 8763

    let {running} = await isRunning('dgmc')

    if (running) {
      console.log('client is running')
    } else {
      if (await portIsFree(eport)) {
        daemon(host, port, eport)
        console.log('client starts successfully')
      } else {
        console.log('port is busy')
      }
    }
  })

program
  .command('stop')
  .action(async () => {
    let {running, list} = await isRunning('dgmc')
    if (running) {
      process.kill(list[0].pid)
    } else {
      console.log('There is nothing to be stopped')
    }
  })

program
  .command('status')
  .action(async () => {
    let {running, list} = await isRunning('dgmc')
    if (running) {
      console.log(`Client is running with pid ${list[0].pid}`)
    } else {
      console.log('Client is not running')
    }
  })

program.parse(process.argv)
