# Client-DigitalMe

This is the relay server that runs on your local machine to receive,
 abstract and relay the data coming from the editors to the remote
 server.
 
Since it runs locally, it allows the DigitalMe to be used offline.

It's part of the [DigitalMe](https://github.com/DingDean/DigitalMe)
project.

## Functionality

### Store editing sessions

Together with editor plugins, Client-DigitalMe would gather your editing
session infos like filename, filetype and total editing time per file
and store them to a remote `database service`.

### Send events when certain editing action happens

Currently, if user is inserting codes, for each input stroke, a ping
event would be fired to a remote `pager service`.

It's intended for visualizing a user's editing session simultaneously.

## Usage

Essentially, Client-DigitalMe is a server running with Express and
NodeJS, there are some variables to configure:

`--eport`:
- description: the port Client-DigitalMe listens to. It's the port where
  your editors would connect to.
- default: 8763

Also, Client-DigitalMe would connect to some remote services to which
the local datas would be relayed, currently the service discovery
mechanism of the project to little to none, it has to be set manually
through environment variables:

`DB_SERVICE`:
- description: the remote database service
- default: 'localhost:50051'

`PAGER_SERVICE`:
- description: the remote pager service
- default: 'localhost:50052'


## Roadmap

- [ ] Benchmark the current setup
- [ ] For each editing session, record the filetype, duration, # of
  line added, # of line deleted, # of line modified
- [ ] Record # of buffered saved everyday
- [ ] Shut down "ping" event when no web clients are connected
