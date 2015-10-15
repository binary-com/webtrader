var ws = require('ws');
var LiveApi = require('binary-live-api').LiveApi;

var api = new LiveApi(ws);

function pingWithEventHandlers() {
    api.events.on('ping', function(response) {
        console.log(response);
    });
    api.ping();
}

function pingWithPromises() {
    api.ping().then(function(response) {
        console.log(response);
    });
}

pingWithEventHandlers();
