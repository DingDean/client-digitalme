require('dotenv').config()

let databaseEP = process.env.DB_SERVICE || 'localhost:50051'
let pagerEP = process.env.PAGER_SERVICE || 'localhost:50052'

module.exports = [
  {name: 'database', conf: {endpoint: databaseEP}},
  {name: 'pager', conf: {endpoint: pagerEP}}
]
