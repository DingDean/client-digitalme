#!/usr/bin/env node

const program = require('commander')
const findp = require('find-process')
const path = require('path')
const main = path.resolve(__dirname, '../index.js')
const {spawn} = require('child_process')
const process = require('process')
const inquirer = require('inquirer')
const axios = require('axios')
const os = require('os')
const fs = require('fs')
const util = require('util')
const open = util.promisify(fs.open)
const writeFile = util.promisify(fs.writeFile)
const readFile = util.promisify(fs.readFile)
const close = util.promisify(fs.close)

const qa = [{
  type: 'input',
  name: 'host',
  message: "What's your server host name",
  default: 'http://localhost:8889',
  async validate (host, inputs) {
    try {
      let res = await axios.get(host + '/hello')
      return res.status === 200
    } catch (e) {
      return 'Please enter a valid server host.'
    }
  }
}, {
  type: 'input',
  name: 'eport',
  message: "What's port should your editors connect to",
  default: 8763,
  validate (eport, inputs) {
    return !isNaN(eport)
  }
}, {
  type: 'password',
  name: 'apiToken',
  message: "What's your api key",
  mask: '*',
  async validate (apiToken, inputs) {
    try {
      let res = await axios
        .post(inputs.host + '/auth',
          { apiToken })
      return res.status === 200
    } catch (e) {
      return 'Please enter a valid api key'
    }
  }
}]

const CONFIG_FILE = path.resolve(os.homedir(), '.mineself.json')
async function getConfig () {
  try {
    let fd = await open(CONFIG_FILE, 'r')
    return readConfig(fd)
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('Config File Does Not Exists, Creating One Now...')
      return setupConfig()
    } else {
      console.log(e)
      process.abort()
    }
  }
}

async function readConfig (fd) {
  try {
    let conf = await readFile(fd, 'utf8')
    await close(fd)
    return JSON.parse(conf)
  } catch (e) {
    console.log(e)
    process.abort()
  }
}

async function setupConfig () {
  try {
    let input = await inquirer.prompt(qa)
    await writeConfig(input)
    console.log('Config is saved to ~/.mineself.json')
    return input
  } catch (e) {
    console.log(e)
    process.abort()
  }
}

async function writeConfig ({host, eport, apiToken}) {
  try {
    let conf = JSON.stringify(
      {host, eport, apiToken},
      null,
      2
    )
    return writeFile(CONFIG_FILE, conf)
  } catch (e) {
    console.log(e)
    process.abort()
  }
}

const daemon = function (host, eport, apiToken) {
  let cmd = 'nohup'
  let argv = [
    'node',
    main,
    `--host ${host}`,
    `--eport ${eport}`,
    `--apiToken ${apiToken}`,
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
  .action(async () => {
    let {host, eport, apiToken} = await getConfig()

    if (!apiToken)
      throw new Error('apiToken NOT FOUND')

    host = host || 'localhost'
    eport = eport || 8763

    Promise.all([
      isRunning('dgmc'),
      portIsFree(eport)
    ])
      .then(([{running}, isFree]) => {
        if (running) {
          console.log('dgmc is running')
          return 1
        } else if (!isFree) {
          console.log(`${eport} is not free`)
          return 1
        } else {
          daemon(host, eport, apiToken)
          console.log('client starts successfully')
          return 0
        }
      })
      .catch(e => {
        console.log(e)
        return 1
      })
  })

program
  .command('stop')
  .action(async () => {
    let {running, list} = await isRunning('dgmc')
    if (running)
      process.kill(list[0].pid)
    else
      console.log('There is nothing to be stopped')
  })

program
  .command('status')
  .action(async () => {
    let {running, list} = await isRunning('dgmc')
    if (running)
      console.log(`Client is running with pid ${list[0].pid}`)
    else
      console.log('Client is not running')
  })

program
  .command('check')
  .action(async () => {
    let {running} = await isRunning('dgmc')
    console.log(running ? 1 : 0)
  })

program.parse(process.argv)
