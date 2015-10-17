/**
 * Created by arnab on 2/24/15.
 */

define(['es6-promise', 'reconnecting-websocket', 'jquery-timer'], function (es6_promise, ReconnectingWebSocket) {
    es6_promise.polyfill(); /* polyfill for es6-promises */

    function WebtraderWebsocket() {
        var api_url = 'wss://www.binary.com/websockets/v2';
        var ws = new ReconnectingWebSocket(api_url);
        ws.debug = false;
        ws.timeInterval = 5400;
        //TODO ws.onerror(...)
        return ws;
    }

    var callbacks = {};
    var buffered_execs = [];
    var buffered_sends = [];
    var unresolved_promises = {};
    var socket = new WebtraderWebsocket();
    var is_connected = function () {
        return socket && socket.readyState === 1;
    }
   
    socket.onopen = function () {
        /* send buffered sends */
        while (buffered_sends.length > 0) {
            socket.send(JSON.stringify(buffered_sends.shift()));
        }
        while (buffered_execs.length > 0)
            buffered_execs.shift()();
    }
    /* execute buffered executes */
    socket.onmessage = function (message) {
        var data = JSON.parse(message.data);

        (callbacks[data.msg_type] || []).forEach(function (cb) {
            cb(data);
        });

        var key = data.echo_req.passthrough && data.echo_req.passthrough.uid;
        var promise = unresolved_promises[key];
        if (promise) {
            delete unresolved_promises[key];
            if (data.error)
                promise.reject(data.error);
            else
                promise.resolve(data);
        }
    }

    require(['websockets/tick_handler']); // require tick_handler to handle ticks.
    require(['websockets/connection_check']); // require connection_check to handle pings.

    return {
        events: {
            on: function (name, cb) {
                (callbacks[name] = callbacks[name] || []).push(cb);
            }
        },
        /* execute callback when the connection is ready */
        execute: function (cb) {
            if (is_connected())
                setTimeout(cb, 0);// always run the callback async
            else
                buffered_execs.push(cb);
        },
        /* send returns an es6-promise */
        send: function (data) {
            data.passthrough = data.passthrough || { };
            data.passthrough.uid =  (Math.random() * 1e17).toString();

            return new Promise(function (resolve,reject) {
                unresolved_promises[data.passthrough.uid] = { resolve: resolve, reject: reject };
                if (is_connected())
                    socket.send(JSON.stringify(data));
                else
                    buffered_sends.push(data);
            });
        }
    }
});
