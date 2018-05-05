const debug = require('debug')('digitme:session')
const Session = function (filename, filetype, index) {
  this.index      = index
  this.filename   = filename
  this.filetype   = filetype
  this.start      = Date.now()
  this.end        = null
  this.lastTick   = Date.now()
  this.ticks      = 0
}
module.exports = Session

Session.current = null
Session.IDLE_TIMEOUT = 60000
Session.new = function (fn, ft, index) {
  if (fn == undefined || ft == undefined || index == undefined)
    throw(new Error('Session.new expects three arguments'))
  if ( typeof fn != 'string' || typeof ft != 'string' )
    throw(new Error('Session.new expects string arguments'))

  let session = new Session(fn, ft)
  debug('A new session is created: ' + JSON.stringify(session))
  return session
}
Session.stash = function ( session ) {
  if ( !session.validate() )
    return
  debug('A session is stashed: ' + JSON.stringify(session))
  Session.history.push( session )
}
Session.history = []

Session.prototype.isExpired = function ( ts ) {
  let timeout = ts - this.lastTick
  return timeout > Session.IDLE_TIMEOUT
}

Session.prototype.isClosed = function () {
  return this.end !== null
}

Session.prototype.beat = function () {
  this.lastTick = Date.now()
  this.ticks++
}

Session.prototype.close = function () {
  this.end = Date.now()
}

Session.prototype.analyze = function () {
  if ( !this.isClosed() )
    return null
  let elapsed = this.end - this.lastTick

  let interval = Math.floor(elapsed / 1000) // convert to seconds
  let speed = this.ticks / interval

  return {speed, elapsed}
}

Session.prototype.validate = function () {
  if ( this.ticks == 0 )
    return false
  let regx = /NERD_TREE*/
  let isNerd = regx.test( this.filename )
  if ( isNerd )
    return false
  if ( this.filename === '' )
    return false
  return true
}
