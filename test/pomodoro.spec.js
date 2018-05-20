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

    it('should rest after tWork + tRest time', function () {
      let spy = sinon.spy(pomo, 'finish')
      pomo.add({name: 'test', tWork: '15'})
      pomo.start('test')
      let {tStart, tEnd} = pomo.current
      let {tRest} = pomo.current.timer.parseTWR()
      let diff = tEnd - tStart
      clock.tick(diff + tRest)
      assert(spy.called)
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

    it('should return err if timer of the name is not running', function () {
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

    it('should set the tPaused of current', function () {
      pomo.start('test')
      pomo.pause()
      assert.equal(typeof pomo.current.tPaused, 'number')
    })

    it('should resume automatically in 5 minutes', function () {
      pomo.start('test')
      let spy = sinon.spy(pomo, 'resume')
      pomo.pause()
      clock.tick(5 * 60000)
      assert(spy.called)
    })
  })

  describe('resume 恢复时钟', function () {
    var pomo
    beforeEach(function () {
      pomo = new Pomodoro()
      pomo.add({name: 'test'})
      pomo.add({name: 'cool'})
      pomo.start('test')
    })

    afterEach(function () {
      if (pomo.current)
        clearTimeout(pomo.current.tid)
    })

    it('should set current state to running', function () {
      let {state} = pomo.current
      assert.equal(state, TimerEnum.running)
    })

    it('should unset tPaused', function () {
      let {tPaused} = pomo.current
      assert.equal(tPaused, null)
    })
  })

  describe('abandon', function () {
    // 终止时钟
  })

  describe('finish', function () {
    // 完成时钟
  })
})
