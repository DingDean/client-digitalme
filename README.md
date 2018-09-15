# mineself-client

This is the relay server that runs on your local machine to receive,
 abstract and relay the data coming from the editors to the remote
 server.
 
Since it runs locally, it allows the Mineself to be used offline.

It's part of the [Mineself](https://github.com/DingDean/Mineself)
project.

## Functionality

### Store editing sessions

Together with editor plugins, mineself-client would gather your editing
session infos like filename, filetype and total editing time per file
and store them to a remote `database service`.

### Send events when certain editing action happens

Currently, if user is inserting codes, for each input stroke, a ping
event would be fired to a remote `pager service`.

It's intended for visualizing a user's editing session simultaneously.

## Usage

Essentially, mineself-client is a server running with Express and
NodeJS, there are some variables to configure:

`--eport`:
- description: the port mineself-client listens to. It's the port where
  your editors would connect to.
- default: 8763

Also, mineself-client would connect to some remote services to which
the local datas would be relayed, currently the service discovery
mechanism of the project to little to none, it has to be set manually
through environment variables:

`DB_SERVICE`:
- description: the remote database service
- default: 'localhost:50051'

`PAGER_SERVICE`:
- description: the remote pager service
- default: 'localhost:50052'
