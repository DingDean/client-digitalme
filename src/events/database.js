const svs = require('../service')

const database = module.exports = {}

database.bootstrap = function (server) {
  server.on('save session', onSaveSession)
  server.on('save tomato', onSaveTomato)
}

function copyWithoutFields (original, fields) {
  let keysToCopy = Object.keys(original).filter(e => !fields.includes(e))
  let trimed = {}
  keysToCopy.forEach(key => {
    trimed[key] = original[key]
  })
  return trimed
}

async function onSaveSession (sessions) {
  let length = sessions.length
  if (length === 0)
    return

  let history = sessions.map(e => {
    let fields = ['index', 'marked']
    return copyWithoutFields(e, fields)
  })

  await svs.saveSession(history)
}

async function onSaveTomato (tomato) {
  await svs.saveTomato(tomato)
}
