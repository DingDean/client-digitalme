module.exports = function ( sender, message ) {
  let { event, data } = message
  if ( event == "ping" ) // pass through handler
    sender.write( JSON.stringify( message ) )
}
