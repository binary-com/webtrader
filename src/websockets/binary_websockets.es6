/**
 * Created by arnab on 2/24/15.
 */

import $ from 'jquery';
import app_ids_json from 'text!../oauth/app_id.json';
import 'common/util';

let is_authenitcated_session = false; /* wether or not the current websocket session is authenticated */
let socket = null;

const get_app_id = () => {
   const app_ids = JSON.parse(app_ids_json);
   const config = local_storage.get('config');
   let token = (config && config.app_id) || '';

   if(!token) { /* find the appropriate token */
      const href = window.location.href;
      for(const web_address in app_ids) {
         if(href.lastIndexOf(web_address, 0) == 0) {
            token = app_ids[web_address];
            break;
         }
      }
   }
   return token;
}

export const app_id = get_app_id();

const connect = () => {
   const config = local_storage.get('config');
   const i18n_name = (local_storage.get('i18n') || { value: 'en' }).value;
   const api_url = ((config && config.websocket_url)  || 'wss://ws.binaryws.com/websockets/v3?l='+i18n_name) + '&brand=champion&app_id=' + app_id;
   const ws = new WebSocket(api_url);

   ws.addEventListener('open', onopen);
   ws.addEventListener('close', onclose);
   ws.addEventListener('message', onmessage);

   ws.addEventListener('error',(event) => {
      $.growl.error({message: 'Connection error.'.i18n()});
      onclose(); // try to reconnect
   });

   return ws;
}

let timeoutIsSet = false;
const onclose = () => {
   require(['windows/tracker'], (tracker) => {
      const trade_dialogs = tracker.get_trade_dialogs();
      is_authenitcated_session = false;
      fire_event('logout');
      /**
       *  The connection is closed, resubscrible to tick streaming.
       *  We have to make sure that resubscribe is atleast 1 second delayed
       **/
        if (timeoutIsSet) { return; }
        timeoutIsSet = true;
        setTimeout(() => {
            timeoutIsSet = false;
            socket = connect();
            if(local_storage.get('oauth')) {
              api.cached.authorize().then(
                 () => tracker.reopen_trade_dialogs(trade_dialogs)
              );
            }
            require(['charts/chartingRequestMap'], (chartingRequestMap) => {
                const chart_registration_promises = [];
               Object.keys(chartingRequestMap).forEach((key) => {
                  const req = chartingRequestMap[key];
                  if (req && req.symbol && !req.timerHandler) { /* resubscribe */
                     const promise = chartingRequestMap.register({
                        symbol: req.symbol,
                        granularity: req.granularity,
                        subscribe: 1,
                        count: 1,
                        style: req.granularity > 0 ? 'candles' : 'ticks'
                     })
                        .catch((err) => console.error(err));
                     chart_registration_promises.push(promise);
                  }
               });

               /* refresh the charts when they are reregistered.  */
               Promise.all(chart_registration_promises)
                  .then(() => {
                     require(['charts/charts', 'charts/chartOptions'], (charts, chartOptions) => {
                        chartOptions.getAllChartsWithTheirTypes().forEach(
                           (chart) => charts.refresh('#' + chart.id + '_chart', null, chart.chartType)
                        );
                     });
                  })
            });
        }, 1000);
   });
}

const callbacks = {};
const buffered_execs = [];
const buffered_sends = [];
const unresolved_promises = { /* req_id: { resolve: resolve, reject: reject, data: data } */};
const cached_promises = { /* key: {data: data, promise: promise } */}; /* requests that have been cached */
const is_connected = () => (socket && socket.readyState === 1);


const onopen = () => {
   /* send buffered sends */
   while (buffered_sends.length > 0) {
      const data = buffered_sends.shift();
      if(!unresolved_promises[data.req_id]) {
         socket.send(JSON.stringify(data));
      }
   }
   /* if the connection got closed while the result of an unresolved request
           is not back yet, issue the same request again */
   for(const key in unresolved_promises) {
      const promise = unresolved_promises[key];
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
const onmessage = (message) => {
   const data = JSON.parse(message.data);

   /* do not block the main thread */
   /* note: this will prevent subscribers from altering callbacks[data.msg_type] array
           while we are iterating on it. this is especially important for tick trades */
   (callbacks[data.msg_type] || []).forEach((cb) => {
      setTimeout(
         () => cb(data)
         , 0);
   });

   const key = data.req_id;
   const promise = unresolved_promises[key];
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
const needs_authentication = (data) => {
   for (const prop in
      { balance: 1, statement: 1,
         profit_table: 1, portfolio: 1,
         proposal_open_contract: 1, buy: 1, sell: 1,
         get_self_exclusion : 1, set_self_exclusion : 1 })
      if (prop in data)
      return true;
   return false;
};

/* send a raw request and return a promise */
let req_id_counter = 0;
const send_request = (data) => {
   data.req_id = ++req_id_counter;

   return new Promise((resolve,reject) => {
      unresolved_promises[data.req_id] = { resolve: resolve, reject: reject, data: data };
      if (is_connected()) {
         socket.send(JSON.stringify(data));
      } else
         buffered_sends.push(data);
   });
};

/* authenticate and return a promise */
const authenticate = (token) => {
   let auth_successfull = false;
   const data = { authorize: token },
      key = JSON.stringify(data),
      promise = send_request(data);

   return promise
      .then((val) => {
         is_authenitcated_session = true;
         local_storage.set('authorize', val.authorize); /* we can use the 'email' field retruned later */
         const is_jpy_account = val.authorize.landing_company_name.indexOf('japan') !== -1;
         if(!is_jpy_account) {
            fire_event('login', val);
         }
         if(local_storage.get('oauth-login')) {
            const ok = local_storage.get('oauth-login').value;
            local_storage.remove('oauth-login');
            if(ok && !is_jpy_account) {
               fire_event('oauth-login', val);
            }
         }
         auth_successfull = true;
         cached_promises[key] = { data: data, promise: promise }; /* cache successfull authentication */

         return val; /* pass the result */
      })
      .catch((up) => {
         if (up.code!=="SelfExclusion" && !auth_successfull) {    /* authentication request is failed, clear local_storage */
            is_authenitcated_session = false;
            fire_event('logout');
            local_storage.remove('oauth');
         }
         delete cached_promises[key];
         throw up; /* pass the exception to next catch */
      });
};

/* un-athenticate current session */
export const invalidate = () => {
   local_storage.remove('oauth');
   local_storage.remove('authorize');
   fire_event("reset_realitycheck");

   api.send({logout: 1}) /* try to logout and if it fails close the socket */
      .catch((err) =>{
         $.growl.error({ message: err.message });
         socket.close();
      });
   /* remove authenticated cached requests as well as authorize requests */
   for(const i in cached_promises)
      if(needs_authentication(cached_promises[i].data) || ('authorize' in cached_promises[i].data))
         delete cached_promises[i];
}

/* first authenticate and then send the request */
const send_authenticated_request = (data) => {
   if (is_authenitcated_session)
      return send_request(data);

   const send_it = send_request.bind(null,data);

   if(local_storage.get('oauth')) {
      const oauth = local_storage.get('oauth');
      let token = oauth[0].token;
      return authenticate(token)
         .then(send_it);
   }
   else
      return Promise.reject({ message: 'Please log in'.i18n()});
};

/* fire a custom event and call registered callbacks(api.events.on(name)) */
const fire_event =(name , ...args) =>{
   const fns = callbacks[name] || [];
   fns.forEach((cb) => {
      setTimeout(
         () => cb.apply(undefined, args)
         ,0);
   });
}

/* the current websocket api (v3) does not return a result for closed markets,
       use this a a temporary workaround to timeout 'ticks_history' api call while laoding charts,
       TODO: wait for backend to fix this! */
const timeout_promise =(key, milliseconds) => {
   setTimeout(() => {
      const promise = unresolved_promises[key];
      if (promise) {
         delete unresolved_promises[key];
         promise.reject({message: 'Timeout for websocket request'.i18n()});
      }
   },milliseconds);
};

const sell_expired_timeouts = {};
const proposal_op_store =  {/* contract_id: { subscribers: n, promise: promise, stream_id: '' } */};
const proposal_open_contract_forget =  {/* contract_id:  promise */};

export const events = {
   on: (name, cb) => {
      (callbacks[name] = callbacks[name] || []).push(cb);
      return cb;
   },
   off: (name, cb) =>{
      if(callbacks[name]) {
         const index = callbacks[name].indexOf(cb);
         index !== -1 && callbacks[name].splice(index, 1);
      }
   },
   /* callback function should return true to unsubscribe */
   on_till:(name, cb) =>{
      const once_cb = (...args) => {
         const done = cb(...args);
         if(done)
            api.events.off(name,once_cb);
      }
      api.events.on(name, once_cb);
   }
}

export const proposal_open_contract = {
   subscribe: (contract_id) => {
      /* already subscribed */
      if(proposal_op_store[contract_id] && proposal_op_store[contract_id].subscribers > 0) {
         proposal_op_store[contract_id].subscribers++;
         return proposal_op_store[contract_id].promise;
      }
      /* subscribe and keep the promise */
      const promise = api.send({proposal_open_contract: 1, contract_id: contract_id, subscribe: 1})
         .then((data) => {
            /* keep stream_id to easily forget */
            proposal_op_store[contract_id].stream_id = data.proposal_open_contract.id;
            return data;
         })
         .catch((up) => {
            proposal_op_store[contract_id] = undefined;
            throw up;
         });
      proposal_op_store[contract_id] = { subscribers: 1, promise: promise };
      return promise;
   },
   forget: (contract_id) => {
      const proposal = proposal_op_store[contract_id];
      const forget = proposal_open_contract_forget[contract_id];
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
      const forgetter = () => {
         proposal_op_store[contract_id] = undefined;
         return api.send({forget: proposal.stream_id})
            .catch((up) => {
               proposal_open_contract_forget[contract_id] = undefined;
               throw up;
            })
            .then((data) => {
               proposal_open_contract_forget[contract_id] = undefined;
               return data;
            })
      };
      if(proposal.stream_id) {
         proposal_open_contract_forget[contract_id] = forgetter();
      } else {
         proposal_open_contract_forget[contract_id] = proposal.promise
            .catch((ex) => { return; })
            .then((data) => {
               if(proposal.stream_id) /* proposal request had not exceptions */
                  return forgetter();
               else return; /* no stream, no need to forget */
            });
      }
      return proposal_open_contract_forget[contract_id];
   }
}

/* execute callback when the connection is ready */
export const execute = (cb) => {
   if (is_connected())
      setTimeout(cb, 0);// always run the callback async
   else
      buffered_execs.push(cb);
}

/* switch account */
export const switch_account = (id) => {
   const oauth = local_storage.get('oauth');
   if(!oauth) {
      return Promise.reject({ message: 'Account token not found.'.i18n() });
   }

   const inx = oauth.map((acc) => acc.id).indexOf(id);
   if(inx === -1) {
      return promise.reject({ message: 'Account id not found.'.i18n() });
   }

   /* move the new account to the front of oauth array */
   const account = oauth[inx];
   oauth.splice(inx,1);
   oauth.unshift(account);
   local_storage.set('oauth', oauth);

   /* remove authenticated cached requests as well as authorize requests */
   for(const i in cached_promises)
      if(needs_authentication(cached_promises[i].data) || ('authorize' in cached_promises[i].data))
         delete cached_promises[i];
   /* back removes all tokens on {logout: 1} request, so we simply reauthenticate
             with the new token without logging out first! ot switch accounts */
   is_authenitcated_session = false;

   /* backend doesn't respect registered authenticated streams :/ */
   api.send({forget_all: 'transaction'})
      .catch((err) => console.error(err));

   api.send({forget_all: 'balance'})
      .catch((err) => console.error(err));

   return api.cached.authorize().then(
      () => fire_event("switch_account")
   );
}

/* if you want a request to be cached, that is when multiple modules request
*  the same data or a module request a data multiple times, instead of calling
*  liveapi.send can liveapi.cached.send.
*  node: this will only cache if the result was successfull */
export const cached  = {
   send:(data) => {
      const key = JSON.stringify(data);
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
            (val) => val, /* on resolve: do nothing */
            (up) => {
               delete cached_promises[key]; throw up;
            } /* on reject: clear cache */
         );
   },
   /* return the promise from last successfull authentication request,
               if the session is not already authorized will send an authentication request */
   authorize: () => {
      const oauth = local_storage.get('oauth');
      const token = oauth && oauth[0] && oauth[0].token,
         key = JSON.stringify({ authorize: token });

      if (is_authenitcated_session && token && cached_promises[key])
         return cached_promises[key].promise;

      return token ? authenticate(token) : /* we have a token => autheticate */
         Promise.reject('Please log in.'.i18n());
   }
}


/* sends a request and returns an es6-promise */
export const send = (data, timeout) => {
   if (data && needs_authentication(data))
      return send_authenticated_request(data);

   const promise = send_request(data);
   if(timeout) timeout_promise(data.req_id, timeout); //NOTE: "timeout" is a temporary fix for backend, try not to use it.
   return promise;
}

/* whether current session is authenticated or not */
export const is_authenticated = () => is_authenitcated_session;


export const sell_expired = (epoch) => {
   const now = (new Date().getTime())/1000 | 0;
   epoch = epoch || now+1; // if epoch is undefined will try to sell expired contract 3 seconds later.
   if(!sell_expired_timeouts[epoch] && epoch*1 > now) {
      sell_expired_timeouts[epoch] = setTimeout(() => {
         sell_expired_timeouts[epoch] = undefined;
         api.send({sell_expired:1}).catch((err) => console.error(err));
      }, (epoch+2 - now)*1000);
   }
}

const api = {
   events,
   proposal_open_contract,
   execute,
   switch_account,
   cached,
   send,
   is_authenticated,
   sell_expired,
   invalidate,
   app_id
}

/* always register for transaction & balance streams */
api.events.on('login',() => {
   api.send({transaction: 1, subscribe:1})
      .catch((err) => console.error(err));

   api.send({balance: 1, subscribe:1})
      .catch((err) => console.error(err));
});
/* always forget transaction & balance streams on logout */
api.events.on('logout',() => {
   api.send({forget_all: 'transaction'})
      .catch((err) => console.error(err));

   api.send({forget_all: 'balance'})
      .catch((err) => console.error(err));
});

 export default api;
