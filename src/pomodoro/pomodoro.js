const EventEmitter = require('events')
const util = require('util')
const TimerEnum = {
  'running': 0,
  'idle': 1,
  'paused': 2,
  'finished': 3,
  'abandoned': 4
}
const Timer = function ({name, tWork, tRest}) {
  this.name = name
  this.tWork = tWork // 单次工作时长
  this.tRest = tRest // 单次休息时长
  this.nFinish = 0 // 完成的次数
  this.nAbandon = 0 // 放弃的次数
  this.nFeel = [] // 每次完成或放弃后的感受
}
Timer.prototype.parseTWR = function () {
  return {tWork: this.tWork * 60000, tRest: this.tRest * 60000}
}

const Pomodoro = function () {
  EventEmitter.call(this)
  this.timers = [] // [Timer, ...]
  // {name, tid, state, tStart, tEnd, tPaused, tResume, hasPaused}
  this.current = null
  // {tStart, tEnd, type}
  this.history = []
}
util.inherits(Pomodoro, EventEmitter)

Pomodoro.prototype.add = function (config) {
  let {name, tWork = 25, tRest = 5} = config
  if (name === undefined || name === null)
    throw (new Error('Timer must have a name property'))
  if (this.timers.find(e => e.name === name))
    throw (new Error('Timer should not have duplicated name!'))

  if (tWork < 15 || tWork > 120)
    throw (new Error('Timer duration outbound'))

  let timer = new Timer({name, tWork, tRest})
  this.timers.push(timer)
  return timer
}

Pomodoro.prototype.start = function (name) {
  let timer = this.timers.find(e => e.name === name)
  if (!timer)
    return `Timer is not found`
  if (this.current)
    return `A timer is already running`
  let {tWork, tRest} = timer.parseTWR()
  let tid = this._start(tWork, tRest)
  let tStart = Date.now()
  let tEnd = tStart + tWork
  this.current = {timer, tid, state: TimerEnum.running, tStart, tEnd}
  this.emit('change')
  return null
}

Pomodoro.prototype._start = function (tWork, tRest) {
  let tid = setTimeout(() => {
    this.finish()
    // TODO: 2018-05-22
    // when configured, repeat the timer after rest.
    // the repeat time should be configured upfront.
    // setTimeout(() => {
    //   this.finishRest()
    // }, tRest)
  }, tWork)
  return tid
}

Pomodoro.prototype.pause = function () {
  if (this.current === null)
    return `nothing to pause`
  if (this.current.state === TimerEnum.paused)
    return 'timer is already paused'
  if (this.current.hasPaused === true)
    return 'no second chance'
  this.current.state = TimerEnum.paused
  let now = Date.now()
  this.current.tPaused = now
  this.current.tResume = now + 300000
  clearTimeout(this.current.tid)
  let tid = setTimeout(() => {
    this.resume()
  }, 300000)
  this.current.tid = tid
  this.current.hasPaused = true
  this.emit('change')
  return null
}

Pomodoro.prototype.resume = function () {
  if (this.current === null)
    return `nothing to resume`
  if (this.current.state === TimerEnum.running)
    return 'timer is not paused'
  let {timer, tPaused, tEnd} = this.current
  let {tRest} = timer
  let tWork = tEnd - tPaused
  let tid = this._start(tWork, tRest)
  this.current.tid = tid
  this.current.tEnd += Date.now() - tPaused
  this.current.state = TimerEnum.running
  this.current.tPaused = null
  this.emit('change')
  return null
}

Pomodoro.prototype.abandon = function () {
  if (this.current === null)
    return `nothing to abandon`
  let {timer, tid, tStart} = this.current
  clearTimeout(tid)
  timer.nAbandon++
  this.current = null
  let history = {tStart, tEnd: Date.now(), type: TimerEnum.abandoned}
  this.history.push(history)
  this.emit('change')
  return null
}

Pomodoro.prototype.finish = function () {
  if (this.current === null)
    return `nothing to finish`
  let {tStart, tEnd, timer} = this.current
  timer.nFinish++
  let history = {type: TimerEnum.finished, tStart, tEnd}
  this.history.push(history)

  this.current = null
  this.emit('finish')
  return null
}

Pomodoro.prototype.getTimer = function (name) {
  return this.timers.find(e => e.name === name)
}

Pomodoro.prototype.getState = function () {
  let msg = {state: 0, tEnd: 0}
  if (this.current) {
    let {tResume, tEnd, state} = this.current
    msg.state = state
    if (state === TimerEnum.paused)
      msg.tEnd = tResume
    else
      msg.tEnd = tEnd
  } else
    msg.state = TimerEnum.idle

  return msg
}

module.exports = {Pomodoro, Timer, TimerEnum}
