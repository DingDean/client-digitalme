const assert = require('assert')
const sinon = require('sinon')
const {Pomodoro, TimerEnum} = require('../src/pomodoro.js')

describe('Pomodoro', function () {
  describe('add 添加时钟配置', function () {
    describe('check name parameters', function () {
      var pomo
      beforeEach(function () {
        pomo = new Pomodoro()
      })
      let senarios = [
        {
          desc: 'should reject any config with null name',
          conf: {name: null}
        },
        {
          desc: 'should reject any config with undefined name',
          conf: {}
        }
      ]
      senarios.forEach(({desc, conf}) => {
        it(desc, function () {
          assert.throws(() => {
            pomo.add(conf)
          })
        })
      })

      it('should reject any duplicated names', function () {
        pomo.add({name: 'test'})
        assert.throws(() => { pomo.add({name: 'test'}) }
        )
      })
    })

    describe('check tWork parameters', function () {
      let pomo
      beforeEach(() => {
        pomo = new Pomodoro()
      })
      let badConfigs = [
        {desc: 'should be >= 15', data: {name: 'test', tWork: 10}},
        {desc: 'should be <= 120', data: {name: 'test', tWork: 130}}
      ]
      badConfigs.forEach(({desc, data}) => {
        it(desc, function () {
          assert.throws(() => {
            pomo.add(data)
          })
        })
      })

      it('should default to 25', function () {
        let timer = pomo.add({name: 'test'})
        assert.equal(timer.tWork, 25)
      })
    })

    describe('check tRest parameters', function () {
      let pomo
      beforeEach(() => {
        pomo = new Pomodoro()
      })
      it('should default to 5', function () {
        let timer = pomo.add({name: 'test'})
        assert.equal(timer.tRest, 5)
      })
    })

    describe('when parameters passed', function () {
      it('should create a new instance and push it to list', function () {
        let pomo = new Pomodoro()
        pomo.add({name: 'test'})
        assert.equal(pomo.timers.length, 1)
        assert.equal(pomo.timers[0].name, 'test')
      })
    })
  })

  describe('start 开始时钟', function () {
    var pomo, clock
    beforeEach(function () {
      pomo = new Pomodoro()
      clock = sinon.useFakeTimers()
    })

    afterEach(function () {
      clock.restore()
    })

    it('should return err if timer is not found', function () {
      pomo.add({name: 'test'})
      let err = pomo.start('none')
      assert.equal(err, `Timer is not found`)
    })

    it('should return err if a timer is already running ', function () {
      pomo.add({name: 'test'})
      pomo.add({name: 'cool'})
      let err = pomo.start('test')
      assert.equal(err, null)
      err = pomo.start('cool')
      assert.equal(err, `A timer is already running`)
    })

    it('should set the current property', function () {
      pomo.add({name: 'test'})
      let err = pomo.start('test')
      assert.equal(err, null)
      let current = pomo.current
      assert.equal(current.state, TimerEnum.running)
      assert.equal(current.timer.name, 'test')
    })

    it('should set the from and to property', function () {
      pomo.add({name: 'test', tWork: '15'})
      pomo.start('test')
      let {tStart, tEnd} = pomo.current
      assert.equal(typeof tStart, 'number')
      assert.equal(typeof tEnd, 'number')
      let diff = tEnd - tStart
      assert.equal(diff, 15 * 60000)
    })

    it('should emit change event', function () {
      let spy = sinon.spy(pomo, 'emit')
      pomo.add({name: 'test'})
      pomo.start('test')
      assert(spy.calledWith('change'))
    })
  })

  describe('pause 暂停时钟', function () {
    var pomo, clock
    beforeEach(function () {
      clock = sinon.useFakeTimers()

      pomo = new Pomodoro()
      pomo.add({name: 'test'})
      pomo.add({name: 'cool'})
    })

    afterEach(function () {
      clock.restore()
    })

    it('should return err if no timer is running', function () {
      let err = pomo.pause()
      assert.equal(err, 'nothing to pause')
    })

    it('should set the current state to paused', function () {
      let err = pomo.start('test')
      assert.equal(err, null)
      err = pomo.pause()
      assert.equal(err, null)
      assert.equal(pomo.current.state, TimerEnum.paused)
    })

    it('should not pause an already paused timer', function () {
      pomo.start('test')
      pomo.pause()
      let err = pomo.pause()
      assert.equal(err, 'timer is already paused')
    })

    it('should not pause the current timer twice', function () {
      pomo.start('test')
      pomo.pause()
      clock.tick(300000)
      assert.equal(pomo.current.state, TimerEnum.running)
      let err = pomo.pause()
      assert.equal(err, 'no second chance')
    })

    it('should resume automatically in 5 minutes after pause', function () {
      pomo.start('test')
      let spy = sinon.spy(pomo, 'resume')
      pomo.pause()
      clock.tick(5 * 60000)
      assert(spy.called)
    })

    it('should set the tResume property of current', function () {
      pomo.start('test')
      pomo.pause()
      assert(pomo.current.hasOwnProperty('tResume'))
      assert.equal(pomo.current.tResume - pomo.current.tPaused, 300000)
    })

    it('should emit change event', function () {
      let spy = sinon.spy(pomo, 'emit')
      pomo.start('test')
      pomo.pause()
      assert(spy.calledTwice)
      assert(spy.calledWith('change'))
    })
  })

  describe('resume 恢复时钟', function () {
    var pomo, clock
    beforeEach(function () {
      clock = sinon.useFakeTimers()
      pomo = new Pomodoro()
      pomo.add({name: 'test'})
      pomo.add({name: 'cool'})
      pomo.start('test')
      pomo.pause()
    })

    afterEach(function () {
      clock.restore()
    })

    it('should set current state to running', function () {
      pomo.resume()
      let {state} = pomo.current
      assert.equal(state, TimerEnum.running)
    })

    it('should unset tPaused', function () {
      pomo.resume()
      let {tPaused} = pomo.current
      assert.equal(tPaused, null)
    })

    it('should add the actual resting time to tEnd stamp', function () {
      pomo.start('test')
      let {tEnd} = pomo.current
      pomo.pause()
      let rest = 180000 // 3m
      clock.tick(rest)
      pomo.resume()
      let {tEnd: newEnd} = pomo.current
      let diff = newEnd - tEnd
      assert.equal(diff, rest)
    })

    it('should emit change event', function () {
      let spy = sinon.spy(pomo, 'emit')
      pomo.resume()
      assert(spy.calledWith('change'))
    })
  })

  describe('abandon 放弃时钟', function () {
    var pomo, clock
    beforeEach(function () {
      clock = sinon.useFakeTimers()

      pomo = new Pomodoro()
      pomo.add({name: 'test'})
      pomo.start('test')
    })

    afterEach(function () {
      clock.restore()
    })

    it('should increment nAbandon of the timer by 1', function () {
      pomo.abandon()
      let timer = pomo.getTimer('test')
      assert.equal(timer.nAbandon, 1)
    })

    it('should clear the current timeout', function () {
      let spyfinish = sinon.spy(pomo, 'finish')
      let spyresume = sinon.spy(pomo, 'resume')
      pomo.abandon()
      clock.next()
      assert.equal(spyfinish.called, false)
      assert.equal(spyresume.called, false)
    })

    it('should emit change event', function () {
      let spy = sinon.spy(pomo, 'emit')
      pomo.abandon()
      assert(spy.calledWith('change'))
    })
  })

  describe('finish 完成时钟', function () {
    var pomo, clock, spyFinish
    beforeEach(function () {
      clock = sinon.useFakeTimers()

      pomo = new Pomodoro()
      pomo.add({name: 'test'})
      pomo.start('test')
      spyFinish = sinon.spy(pomo, 'finish')
    })

    afterEach(function () {
      clock.restore()
    })

    it('should be called after tWork time if not being paused', function () {
      let {timer} = pomo.current
      let {tWork} = timer.parseTWR()
      clock.tick(tWork)
      assert(spyFinish.called, true)
    })

    it('should increment nFinish of the timer by 1', function () {
      clock.next() // actual work stops, and rest begin
      let timer = pomo.getTimer('test')
      assert.equal(timer.nFinish, 1)
    })

    it('should add the session to the history', function () {
      clock.next()
      let history = pomo.getRecentHistory()
      assert.equal(history.name, 'test')
    })
  })

  describe('getState', function () {
    describe('return value', function () {
      var result
      beforeEach(function () {
        let pomo = new Pomodoro()
        result = pomo.getState()
      })

      afterEach(function () {
        result = null
      })

      let props = [
        {name: 'state', type: 'number'},
        {name: 'tEnd', type: 'number'}
      ]

      props.forEach(({name, type}) => {
        it(`should have properfty ${name} `, function () {
          assert(result.hasOwnProperty(name))
        })
        it(`${name} should be of type ${type}`, function () {
          assert.equal(typeof result[name], type)
        })
      })
    })

    describe('when idle', function () {
      var result
      beforeEach(function () {
        let pomo = new Pomodoro()
        result = pomo.getState()
      })
      it('should return state as 1', function () {
        assert.equal(result.state, 1)
      })
      it('should return tEnd as 0', function () {
        assert.equal(result.tEnd, 0)
      })
    })

    describe('when active', function () {
      var result
      beforeEach(function () {
        let pomo = new Pomodoro()
        pomo.add({name: 'test'})
        pomo.start('test')
        result = pomo.getState()
      })
      it('should return state as 0', function () {
        assert.equal(result.state, 0)
      })
    })
  })
})
