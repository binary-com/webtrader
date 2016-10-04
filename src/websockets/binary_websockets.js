/**
 * Created by arnab on 2/24/15.
 */

define(['jquery', 'text!oauth/app_id.json', 'common/util'], function ($, app_ids_json) {

    var is_authenitcated_session = false; /* wether or not the current websocket session is authenticated */
    var socket = null;

    function get_app_id() {
      var app_ids = JSON.parse(app_ids_json);
      var config = local_storage.get('config');
      var token = (config && config.app_id) || '';

      if(!token) { /* find the appropriate token */
        var href = window.location.href;
        for(var web_address in app_ids) {
          if(href.lastIndexOf(web_address, 0) == 0) {
            token = app_ids[web_address];
            break;
          }
        }
      }
      return token;
    }
    var app_id = get_app_id();

    var connect = function () {
        var config = local_storage.get('config');
        var i18n_name = (local_storage.get('i18n') || { value: 'en' }).value;
        var api_url = ((config && config.websocket_url)  || 'wss://ws.binaryws.com/websockets/v3?l='+i18n_name) + '&app_id=' + app_id;
        var ws = new WebSocket(api_url);

        ws.addEventListener('open', onopen);
        ws.addEventListener('close', onclose);
        ws.addEventListener('message', onmessage);

        ws.addEventListener('error', function(event) {
            $.growl.error({message: 'Connection error. Refresh the page.'.i18n().i18n()});
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
            if(local_storage.get('oauth'))
              api.cached.authorize();
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
    var unresolved_promises = { /* req_id: { resolve: resolve, reject: reject, data: data } */};
    var cached_promises = { /* key: {data: data, promise: promise } */}; /* requests that have been cached */
    var is_connected = function () {
        return socket && socket.readyState === 1;
    }

    var onopen = function () {
        /* send buffered sends */
        while (buffered_sends.length > 0) {
            var data = buffered_sends.shift();
            if(!unresolved_promises[data.req_id]) {
              socket.send(JSON.stringify(data));
            }
        }
        /* if the connection got closed while the result of an unresolved request
           is not back yet, issue the same request again */
        for(var key in unresolved_promises) {
          var promise = unresolved_promises[key];
          if(!promise) continue;
          if(promise.sent_before) { /* reject if sent once before */
              promise.reject({message: 'Connection closed.'.i18n()});
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
        var data = JSON.parse(message.data);

        /* do not block the main thread */
        /* note: this will prevent subscribers from altering callbacks[data.msg_type] array
           while we are iterating on it. this is especially important for tick trades */
        (callbacks[data.msg_type] || []).forEach(function(cb) {
            setTimeout(function(){
                cb(data);
            }, 0);
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

    socket = connect(); // connect

    //This is triggering asycn loading of tick_handler.
    //The module will automatically start working as soon as its loaded
    require(['websockets/stream_handler']); // require tick_handler to handle ticks.

    /* whether the given request needs authentication or not */
    var needs_authentication = function (data) {
        for (var prop in
                    { balance: 1, statement: 1,
                        profit_table: 1, portfolio: 1,
                        proposal_open_contract: 1, buy: 1, sell: 1,
                        get_self_exclusion : 1, set_self_exclusion : 1 })
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
                socket.send(JSON.stringify(data));
            } else
                buffered_sends.push(data);
        });
    };

    /* authenticate and return a promise */
    var authenticate = function (token) {
        var auth_successfull = false,
            data = { authorize: token },
            key = JSON.stringify(data),
            promise = send_request(data);

        return promise
            .then(function (val) {
                is_authenitcated_session = true;
                local_storage.set('authorize', val.authorize); /* we can use the 'email' field retruned later */
                var is_jpy_account = val.authorize.landing_company_name.indexOf('japan') !== -1;
                if(!is_jpy_account) {
                   fire_event('login', val);
                }
                if(local_storage.get('oauth-login')) {
                  var ok = local_storage.get('oauth-login').value;
                  local_storage.remove('oauth-login');
                  if(ok && !is_jpy_account) {
                    fire_event('oauth-login', val);
                  }
                }
                auth_successfull = true;
                cached_promises[key] = { data: data, promise: promise }; /* cache successfull authentication */

                return val; /* pass the result */
            })
            .catch(function (up) {
                if (!auth_successfull) {    /* authentication request is failed, clear local_storage */
                    is_authenitcated_session = false;
                    fire_event('logout');
                    local_storage.remove('oauth');
                }
                delete cached_promises[key];
                throw up; /* pass the exception to next catch */
            });
    };

    /* un-athenticate current session */
    var invalidate = function(){
        if(!is_authenitcated_session) { return; }
        local_storage.remove('oauth');
        local_storage.remove('authorize');

        api.send({logout: 1}) /* try to logout and if it fails close the socket */
          .catch(function(err){
            $.growl.error({ message: err.message });
            socket.close();
          });
        /* remove authenticated cached requests as well as authorize requests */
        for(var i in cached_promises)
          if(needs_authentication(cached_promises[i].data) || ('authorize' in cached_promises[i].data))
            delete cached_promises[i];
    }

    /* first authenticate and then send the request */
    var send_authenticated_request = function (data) {
        if (is_authenitcated_session)
            return send_request(data);

        var send = send_request.bind(null,data);// function () { return send_request(data); };

        if(local_storage.get('oauth')) {
            var oauth = local_storage.get('oauth');
            var token = oauth[0].token;
            return authenticate(token)
                    .then(send);
        }
        else
          return Promise.reject({ message: 'Please log in'.i18n()});
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
             promise.reject({message: 'Timeout for websocket request'.i18n()});
         }
       },milliseconds);
    };

    var sell_expired_timeouts = {};
    var proposal_open_contract =  {/* contract_id: { subscribers: n, promise: promise, stream_id: '' } */};
    var proposal_open_contract_forget =  {/* contract_id:  promise */};
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
            },
            /* callback function should return true to unsubscribe */
            on_till: function(name, cb){
              var once_cb = function(){
                var done = cb.apply(this, arguments);
                if(done)
                  api.events.off(name,once_cb);
              }
              api.events.on(name, once_cb);
            }
        },
        proposal_open_contract: {
          subscribe: function(contract_id) {
            /* already subscribed */
            if(proposal_open_contract[contract_id] && proposal_open_contract[contract_id].subscribers > 0) {
                proposal_open_contract[contract_id].subscribers++;
                return proposal_open_contract[contract_id].promise;
            }
            /* subscribe and keep the promise */
            var promise = api.send({proposal_open_contract: 1, contract_id: contract_id, subscribe: 1})
              .then(function(data){
                /* keep stream_id to easily forget */
                proposal_open_contract[contract_id].stream_id = data.proposal_open_contract.id;
                return data;
              })
              .catch(function(up) {
                proposal_open_contract[contract_id] = undefined;
                throw up;
              });
            proposal_open_contract[contract_id] = { subscribers: 1, promise: promise };
            return promise;
          },
          forget: function (contract_id) {
            var proposal = proposal_open_contract[contract_id];
            var forget = proposal_open_contract_forget[contract_id];
            if(!proposal) {
              return forget || Promise.resolve(); /* contract is being forgetted or does not exit */
            }
            if(proposal.subscribers == 0) {
              return forget; /* contract is being forgetted */
            }
            proposal.subscribers--;
            if(proposal.subscribers > 0) { /* there are still subscribers to this contract_id */
              return Promise.resolve();
            }
            var forgetter = function() {
              proposal_open_contract[contract_id] = undefined;
              return api.send({forget: proposal.stream_id})
                .catch(function(up) {
                  proposal_open_contract_forget[contract_id] = undefined;
                  throw up;
                })
                .then(function(data){
                  proposal_open_contract_forget[contract_id] = undefined;
                  return data;
                })
            };
            if(proposal.stream_id) {
              proposal_open_contract_forget[contract_id] = forgetter();
            } else {
              proposal_open_contract_forget[contract_id] = proposal.promise
                .catch(function(ex){ return; })
                .then(function(data){
                  if(proposal.stream_id) /* proposal request had not exceptions */
                    return forgetter();
                  else return; /* no stream, no need to forget */
                });
            }
            return proposal_open_contract_forget[contract_id];
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
        /* switch account */
        switch_account: function(id) {
          if(!is_authenitcated_session) {
            return Promise.reject({message: 'Session is not authenticated.'.i18n()})
          }
          var oauth = local_storage.get('oauth');
          if(!oauth) {
            return Promise.reject({ message: 'Account token not found.'.i18n() });
          }

          var inx = oauth.map(function(acc) { return acc.id; }).indexOf(id);
          if(inx === -1) {
            return promise.reject({ message: 'Account id not found.'.i18n() });
          }

          /* move the new account to the front of oauth array */
          var account = oauth[inx];
          oauth.splice(inx,1);
          oauth.unshift(account);
          local_storage.set('oauth', oauth);

          /* remove authenticated cached requests as well as authorize requests */
          for(var i in cached_promises)
            if(needs_authentication(cached_promises[i].data) || ('authorize' in cached_promises[i].data))
              delete cached_promises[i];
          /* back removes all tokens on {logout: 1} request, so we simply reauthenticate
             with the new token without logging out first! ot switch accounts */
          is_authenitcated_session = false;

          /* backend doesn't respect registered authenticated streams :/ */
          api.send({forget_all: 'transaction'})
             .catch(function(err){ console.error(err); });

          api.send({forget_all: 'balance'})
             .catch(function(err){ console.error(err); });

          return api.cached.authorize();
        },
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
                    return cached_promises[key].promise;
                /* We don't want to cache promises that are rejected,
                   Clear the cache in case of promise rejection */
                cached_promises[key] = { data: data, promise: null };
                return cached_promises[key].promise = api.send(data)
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
                var oauth = local_storage.get('oauth');
                var token = oauth && oauth[0] && oauth[0].token,
                    key = JSON.stringify({ authorize: token });

                if (is_authenitcated_session && token && cached_promises[key])
                    return cached_promises[key].promise;

                return token ? authenticate(token) : /* we have a token => autheticate */
                               Promise.reject('Please log in.'.i18n());
            }
        },
        /* sends a request and returns an es6-promise */
        send: function (data, timeout) {
            if (data && needs_authentication(data))
                return send_authenticated_request(data);

            var promise = send_request(data);
            if(timeout) timeout_promise(data.req_id, timeout); //NOTE: "timeout" is a temporary fix for backend, try not to use it.
            return promise;
        },
        /* whether current session is authenticated or not */
        is_authenticated: function () {
          return is_authenitcated_session;
        },
        sell_expired: function(epoch) {
            var now = (new Date().getTime())/1000 | 0;
            epoch = epoch || now+1; // if epoch is undefined will try to sell expired contract 3 seconds later.
            if(!sell_expired_timeouts[epoch] && epoch*1 > now) {
              sell_expired_timeouts[epoch] = setTimeout(function(){
                sell_expired_timeouts[epoch] = undefined;
                api.send({sell_expired:1}).catch(function(err){ console.error(err);});
              }, (epoch+2 - now)*1000);
            }
        },
        app_id: app_id
    }
    /* always register for transaction & balance streams */
    api.events.on('login', function() {
      api.send({transaction: 1, subscribe:1})
         .catch(function(err){ console.error(err); });

      api.send({balance: 1, subscribe:1})
         .catch(function(err){ console.error(err); });
    });
    return api;
});
