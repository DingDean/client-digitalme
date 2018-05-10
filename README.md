# Client-DigitalMe

This is the relay server that runs on your local machine to receive,
 abstract and relay the data coming from the editors to the remote
 server.
 
Since it runs locally, it allows the DigitalMe to be used offline.

## Roadmap

- [ ] Benchmark the current setup
- [ ] For each editing session, record the filetype, duration, # of
  line added, # of line deleted, # of line modified
- [ ] Record # of buffered saved everyday
- [ ] TCP Authentication over ZAP
- [ ] Shut down "ping" event when no web clients are connected
