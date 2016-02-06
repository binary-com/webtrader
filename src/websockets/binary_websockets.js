/**
 * Created by arnab on 2/24/15.
 */

define(['jquery'], function ($) {

    var Cookies = null,
        tokenWin = null;
    /* these dependencies are only need for authenticated api sends.
       load them on demand, so websocket can start before loading them.  */
    var authentication_deps = new Promise(function (resolve, reject) {
        require(['js-cookie', 'token/token'], function (_cookies, _tokenwin) {
            Cookies = _cookies;
            tokenWin = _tokenwin;
            resolve();
        });
    });
    /* don't wait for an authenticated request, trigger loading these now */
    require(['js-cookie', 'token/token']);

    var is_authenitcated_session = false; /* wether or not the current websocket session is authenticated */

    var socket = null;

    var connect = function () {
        var api_url = 'wss://ws.binaryws.com/websockets/v3?l=EN';
        var ws = new WebSocket(api_url);

        ws.addEventListener('open', onopen);
        ws.addEventListener('close', onclose);
        ws.addEventListener('message', onmessage);

        ws.addEventListener('error', function(event) {
            console.log('WS connection error : ', event);
            // TODO: 1-consume this notification 2-do not use global notifications, use a better approach.
            $(document).trigger("feedTypeNotification", ['websocket-error', "noconnection-feed"]);
            $.growl.error({message: "Connection error. Refresh page!"});
            //Clear everything. No more changes on chart. Refresh of page is needed!
        });

        return ws;
    }

    var onclose = function () {
        is_authenitcated_session = false;
        fire_event('logout');
        /**
         *  The connection is closed, resubscrible to tick streaming.
         *  We have to make sure that resubscribe is atleast 1 second delayed
         **/
        setTimeout(function(){
            socket = connect();
            require(['charts/chartingRequestMap'], function (chartingRequestMap) {
                Object.keys(chartingRequestMap).forEach(function (key) {
                    var req = chartingRequestMap[key];
                    if (req && req.symbol && !req.timerHandler) { /* resubscribe */
                        chartingRequestMap.register({
                          symbol: req.symbol,
                          granularity: req.granularity,
                          subscribe: 1,
                          count: 1,
                          style: req.granularity > 0 ? 'candles' : 'ticks'
                        }).catch(function (err) { console.error(err); });
                    }
                });
            });
        }, 1000);
    }

    var callbacks = {};
    var buffered_execs = [];
    var buffered_sends = [];
    var unresolved_promises = {};
    var cached_promises = {}; /* requests that have been cached */
    var is_connected = function () {
        return socket && socket.readyState === 1;
    }

    var onopen = function () {
        /* send buffered sends */
        while (buffered_sends.length > 0) {
            socket.send(JSON.stringify(buffered_sends.shift()));
        }
        /* if the connection got closed while the result of an unresolved request
           is not back yet, issue the same request again */
        for(var key in unresolved_promises) {
          var promise = unresolved_promises[key];
          if(!promise) continue;
          if(promise.sent_before) { /* reject if sent once before */
              promise.reject({message: 'connection closed'});
          } else { /* send */
              promise.sent_before = true;
              socket.send(JSON.stringify(promise.data));
          }
        }
        while (buffered_execs.length > 0)
            buffered_execs.shift()();
    }

    /* execute buffered executes */
    var onmessage = function (message) {
        console.log('Server response : ', message);
        var data = JSON.parse(message.data);

        (callbacks[data.msg_type] || []).forEach(function (cb) {
          /* do not block the main thread */
          setTimeout(function(){
            cb(data);
          },0);
        });

        var key = data.req_id;
        var promise = unresolved_promises[key];
        if (promise) {
            delete unresolved_promises[key];
            if (data.error) {
                data.error.echo_req = data.echo_req;
                data.error.req_id = data.req_id;
                promise.reject(data.error);
            }
            else
                promise.resolve(data);
        }
    }

    socket = connect();

    //This is triggering asycn loading of tick_handler.
    //The module will automatically start working as soon as its loaded
    require(['websockets/stream_handler']); // require tick_handler to handle ticks.

    /* whether the given request needs authentication or not */
    var needs_authentication = function (data) {
        for (var prop in { balance: 1, statement: 1, profit_table: 1, portfolio: 1, proposal_open_contract: 1, buy: 1, sell: 1 })
            if (prop in data)
                return true;
        return false;
    };

    /* send a raw request and return a promise */
    var req_id_counter = 0;
    var send_request = function (data) {
        data.req_id = ++req_id_counter;

        return new Promise(function (resolve,reject) {
            unresolved_promises[data.req_id] = { resolve: resolve, reject: reject, data: data };
            if (is_connected()) {
                console.log('Request object : ', JSON.stringify(data));
                socket.send(JSON.stringify(data));
            } else
                buffered_sends.push(data);
        });
    };

    /* authenticate and return a promise */
    var authenticate = function (token) {
        var auth_successfull = false,
            key = JSON.stringify({ authorize: token }),
            promise = send_request({ authorize: token });

        return promise
            .then(function (val) {
                Cookies.set('webtrader_token', token); /* never expiers */
                is_authenitcated_session = true;
                fire_event('login', val);
                auth_successfull = true;
                cached_promises[key] = promise; /* cache successfull authentication */
                return val; /* pass the result */
            })
            .catch(function (up) {
                if (!auth_successfull) {    /* authentication request is failed, delete the cookie */
                    is_authenitcated_session = false;
                    fire_event('logout');
                    Cookies.remove('webtrader_token');
                }
                delete cached_promises[key];
                throw up; /* pass the exception to next catch */
            });
    };

    /* un-athenticate current session */
    var invalidate = function(){
        if(!is_authenitcated_session) { return; }
        Cookies.remove('webtrader_token');
        socket.close();
    }

    /* first authenticate and then send the request */
    var send_authenticated_request = function (data) {
        if (is_authenitcated_session)
            return send_request(data);

        var send = send_request.bind(null,data);// function () { return send_request(data); };

        if (Cookies.get('webtrader_token'))     /* we have a cookie for the token */
            return authenticate(Cookies.get('webtrader_token'))
                    .then(send);
        else                                    /* get the token from user */
            return tokenWin
                .getTokenAsync()
                .then(authenticate)
                .catch(function(up){
                  require(["jquery", "jquery-growl"], function($) { $.growl.error({ message: up.message });});
                  throw up;
                })
                .then(send);
    };

    /* fire a custom event and call registered callbacks(api.events.on(name)) */
    var fire_event = function(name /*, args */){
      var args = [].slice.call(arguments,1);
      var fns = callbacks[name] || [];
      fns.forEach(function (cb) {
          setTimeout(function(){
            cb.apply(undefined, args);
          },0);
      });
    }

    /* the current websocket api (v3) does not return a result for closed markets,
       use this a a temporary workaround to timeout 'ticks_history' api call while laoding charts,
       TODO: wait for backend to fix this! */
    var timeout_promise = function(key, milliseconds) {
       setTimeout(function() {
         var promise = unresolved_promises[key];
         if (promise) {
             delete unresolved_promises[key];
             promise.reject({message: 'timeout for websocket request'});
         }
       },milliseconds);
    };

    var sell_expired_timeouts = {};
    var api = {
        events: {
            on: function (name, cb) {
                (callbacks[name] = callbacks[name] || []).push(cb);
                return cb;
            },
            off: function(name, cb){
                if(callbacks[name]) {
                  var index = callbacks[name].indexOf(cb);
                  index !== -1 && callbacks[name].splice(index, 1);
                }
            }
        },
        /* execute callback when the connection is ready */
        execute: function (cb) {
            if (is_connected())
                setTimeout(cb, 0);// always run the callback async
            else
                buffered_execs.push(cb);
        },
        /* remove token, and reopen current socket */
        invalidate: invalidate,
        /* if you want a request to be cached, that is when multiple modules request
           the same data or a module request a data multiple times, instead of calling
           liveapi.send can liveapi.cached.send.
           node: this will only cache if the result was successfull */
        cached :{
            send: function(data){
                var key = JSON.stringify(data);
                /* if there is a cached promise for this key (let say P), return P.
                 * assume P is in pending state, when P is fullfiled all attached .then() calls will run.
                 * assume P is in rejected state (or in fullfiled state), the changed .then() calls will be immediately rejected(or fullfiled).  */
                if (cached_promises[key])
                    return cached_promises[key];
                /* We don't want to cache promises that are rejected,
                   Clear the cache in case of promise rejection */
                return cached_promises[key] = api.send(data)
                    .then(
                        function (val) {
                            return val;
                        }, /* on resolve: do nothing */
                        function (up) {
                            delete cached_promises[key]; throw up;
                        } /* on reject: clear cache */
                    );
            },
            /* return the promise from last successfull authentication request,
               if the session is not already authorized will send an authentication request */
            authorize: function () {
                return authentication_deps.then(function () {
                    var token = Cookies.get('webtrader_token'),
                        key = JSON.stringify({ authorize: token });

                    if (is_authenitcated_session && token && cached_promises[key])
                        return cached_promises[key];

                    return token ? authenticate(token) : /* we have a token => autheticate */
                                      tokenWin.getTokenAsync()
                                      .then(authenticate) /* get the token from user and authenticate */
                                      .catch(function(up){
                                        require(["jquery", "jquery-growl"], function($) { $.growl.error({ message: up.message });});
                                        throw up;
                                      });
                })
            }
        },
        /* sends a request and returns an es6-promise */
        send: function (data, timeout) {
            if (data && needs_authentication(data))
                return authentication_deps.then(function () {
                    return send_authenticated_request(data);
                });

            var promise = send_request(data);
            if(timeout) timeout_promise(data.req_id, timeout); //NOTE: "timeout" is a temporary fix for backend, try not to use it.
            return promise;
        },
        /* whether currenct session is authenticated or not */
        is_authenticated: function () {
          return is_authenitcated_session;
        },
        sell_expired: function(epoch){
            var now = (new Date().getTime())/1000 | 0;
            if(!sell_expired_timeouts[epoch] && epoch*1 > now) {
              sell_expired_timeouts[epoch] = setTimeout(function(){
                sell_expired_timeouts[epoch] = undefined;
                api.send({sell_expired:1}).catch(function(err){ console.error(err);});
              }, (epoch+2 - now)*1000);
            }
        }
    }
    /* always register for transaction stream */
    api.events.on('login', function() {
      api.send({transaction: 1, subscribe:1})
         .catch(function(err){ console.error(err); });
    });
    /* always register for balance stream */
    api.events.on('login', function() {
      api.send({balance: 1, subscribe:1})
         .catch(function(err){ console.error(err); });
    });
    return api;
});
