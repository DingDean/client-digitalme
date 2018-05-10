const sinon = require('sinon')
const assert = require('assert')
const Session = require('../src/session.js')

function validSession () {
  let filename = 'valid' + Session.index
  let filetype = 'js' + Session.index
  let session = Session.new( filename, filetype )
  // a valid session must tick
  for (let i=0; i<Session.index; i++)
    session.beat()
  return session
}

function inValidSession () {
  let a = Session.new('', 'js', 1)
  a.beat()
  let b = Session.new('NERD_TREE', '', 1)
  b.beat()
  let c = Session.new('a', 'js', 1)

  let invalids = [a, b, c]
  return invalids[ Session.index % 3]
}

describe('Session', function () {
  describe('static new()', function() {
    it('should have two arguments', function () {
      assert.throws( () => { Session.new() })
      assert.throws( () => { Session.new('s') })
      assert.doesNotThrow( () => { Session.new('s', 's') })
    })

    let invalidTypes = [
      {type: 'number', value: 1},
      {type: 'undefined', value: undefined},
      {type: 'object', value: null},
      {type: 'object', value: {}},
      {type: 'function', value: function () {}}
    ]
    invalidTypes.forEach(type => {
      it('should not accept argument of type ' + type.type, function () {
        assert.throws( () => { Session.new(type.value, type.value) } )
      })
    })

    it('should return a new session', function () {
      let session = Session.new('unique current', 'tst')
      assert( session instanceof Session )
    })

    it('should increment Session.index by 1', function () {
      let oldIndex = Session.index
      Session.new('a', 'js')
      assert( Session.index - oldIndex == 1 )
    })
  });

  describe('static stash()', function () {
    it('should only stash valid session', function () {
      let session = Session.new('t', 't')
      let spy = sinon.spy( session, 'validate' )
      Session.stash( session )
      assert( spy.called )
    })

    it('close the session if not already', function () {
      let session = validSession()
      Session.stash( session )
      assert( session.isClosed() )
    })
  })

  describe('properties', function () {
    var session, testfn, testfy, testidex;

    beforeEach(function() {
      testindex = 9999
      testfn = 'testFileName'
      testft = 'testFileType'
      session = new Session(testfn, testft, testindex)
    })

    it('should have index property as given', function () {
      assert.equal( session.index, testindex )
    })

    it('should have filename property as given', function () {
      assert.equal( session.filename, testfn )
    })

    it('should have filetype property as given', function () {
      assert.equal( session.filetype, testft )
    })

    let props = ['start', 'end', 'lastTick', 'ticks', 'marked']
    props.forEach( function(prop) {
      it('should have ' + prop + ' property', function () {
        for (const prop of props)
          assert.equal( session.hasOwnProperty(prop), true)
      })
    } )
  })

  describe('beat', function () {
    var session
    beforeEach(function() {
      session = Session.new('testfn', 'testft')
    });

    it('should update lastTick to current time', function (done) {
      let oldTick = session.lastTick
      setTimeout(function () {
        session.beat()
        assert.equal( session.lastTick > oldTick, true )
        done()
      }, 10)
    })

    it('should increment ticks by 1', function () {
      let oldTick = session.ticks
      session.beat()
      assert.equal( session.ticks - oldTick, 1 )
    })

  })

  describe('close', function () {
    it('should override the file info if the session is marked', function () {
      let session = Session.new('','t')
      session.marked = true
      session.close( {filename: 'f', filetype: 'js'} )
      assert.equal( session.filename, 'f' )
      assert.equal( session.filetype, 'js' )
    })
  })

  //describe('analyze', function () {
    //it('should only analyze a closed session', function () {
      //let session = Session.new('testfn', 'testft')
      //let result = session.analyze()
      //assert.deepEqual( result, null )
    //})

    //it("should return the session's coding speed", function (done) {
      //let session = Session.new('name', 'type')

      //session.beat()
      //session.beat()

      //setTimeout( () => {
        //session.close()
        //let {speed} = session.analyze()

        //assert.equal( typeof speed, 'number' )
        //assert.equal( speed > 0, true )
        //done()
      //}, 200)
    //})

    //it('should return the elapsed time of the session', function (done) {
      //let session = Session.new('name', 'type')

      //session.beat()
      //session.beat()

      //setTimeout( () => {
        //session.close()
        //let {elapsed} = session.analyze()

        //assert.equal( typeof elapsed, 'number' )
        //assert.equal( elapsed >= 200, true )
        //done()
      //}, 200)
    //})
  //})

  describe('validate', function () {
    it('should reject any session with name match /NERD_TREE*/ ', function () {
      let name = 'NERD_TREE_2'
      let type = ''
      let session = Session.new( name, type, 1 )
      assert.equal( session.validate(), false )
    })

    it('should reject any session with empty name', function () {
      let name = ''
      let type = ''
      let session = Session.new( name, type, 1 )
      assert.equal( session.validate(), false )
    })

    it( 'should reject any session that has no ticks', function () {
        let name = 'validnmae'
        let type = 'js'
        let session = Session.new( name, type, 1 )
        // no ticks
        assert.equal( session.validate(), false )
    })
  })
})

