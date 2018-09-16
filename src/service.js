const service = module.exports = {}
const agent = require('superagent')
const debug = require('debug')('dgmc:db')

let _accessToken // initialized in service.init
let _apiToken
let _host

service.init = async function (host, apiToken) {
  let res = await agent
    .post(host + '/auth')
    .send({
      apiToken
    })
  let {access_token} = res.body
  _host = host
  _accessToken = access_token
  _apiToken = apiToken
}

let _sessionBuf = []
service.saveSession = async function (sessions) {
  try {
    await agent
      .post(_host + '/editor/sessions')
      .set('Authorization', `Bearer ${_accessToken}`)
      .send({sessions})
    debug('Sessions are synced to remote')
  } catch (e) {
    await refreshToken()
    debug('sessions are buffered')
    _sessionBuf.push(sessions)
  }
}

let _tomatoBuf = []
service.saveTomato = async function (tomatoes) {
  try {
    await agent
      .post(_host + '/pomodoro')
      .set('Authorization', `Bearer ${_accessToken}`)
      .send({pomodoros: tomatoes})
    debug('Tomatoes are synced to remote')
  } catch (e) {
    await refreshToken()
    debug('tomatoes are buffered')
    _tomatoBuf.push(tomatoes)
  }
}

async function refreshToken () {
  try {
    await service.init(_host, _apiToken)
  } catch (e) {
    debug('reauthorization failed' + e)
  }
}

setInterval(async () => {
  let sessions = _sessionBuf.map(service.saveSession)
  let tomatoes = _tomatoBuf.map(service.saveTomato)

  try {
    await Promise.all([...sessions, ...tomatoes])
    _sessionBuf = []
    _tomatoBuf = []
  } catch (e) {
    debug(e)
  }
}, 3600000)
