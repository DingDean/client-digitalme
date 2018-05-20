// const debug = require('debug')('digitme:pomodoro')

const TimerEnum = {
  'running': 0,
  'paused': 1
}
const Timer = function ({name, tWork, tRest}) {
  this.name = name
  this.tWork = tWork // 单次工作时长
  this.tRest = tRest // 单次休息时长
  this.nFinish = 0 // 完成的次数
  this.nStop = 0 // 放弃的次数
  this.nFeel = [] // 每次完成或放弃后的感受
}
Timer.prototype.parseTWR = function () {
  return {tWork: this.tWork * 60000, tRest: this.tRest * 60000}
}

const Pomodoro = function () {
  this.timers = [] // [Timer, ...]
  this.current = null // {name, tid, state, tStart, tEnd, tPaused}
}

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
  return null
}
Pomodoro.prototype._start = function (tWork, tRest) {
  let tid = setTimeout(() => {
    setTimeout(() => {
      this.finish()
    }, tRest)
  }, tWork)
  return tid
}

Pomodoro.prototype.pause = function () {
  if (this.current === null)
    return `nothing to pause`
  if (this.current.state === TimerEnum.paused)
    return 'timer is already paused'
  this.current.state = TimerEnum.paused
  this.current.tPaused = Date.now()
  clearTimeout(this.current.tid)
  let tid = setTimeout(() => {
    this.resume()
  }, 300000)
  this.current.tid = tid
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
  this.current.state = TimerEnum.running
  this.current.tPaused = null
  return null
}

Pomodoro.prototype.finish = function () {

}

module.exports = {Pomodoro, Timer, TimerEnum}
