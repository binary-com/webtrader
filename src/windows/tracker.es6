/**
 * Created by amin on May 27, 2016.
 */

import windows from "../windows/windows";
import liveapi from "../websockets/binary_websockets";
import _ from "lodash";
import menu from "../navigation/menu";

let states = local_storage.get('states') || { };
let saved_states = { };

const symbols_promise = liveapi.cached
   .send({ trading_times: new Date().toISOString().slice(0, 10) })
   .then((data) => {
      const markets = menu.extractChartableMarkets(data);
      const symbols = _(markets).map('submarkets').flatten().map('instruments').flatten().map('symbol').value();
      symbols.instruments = _(markets).map('submarkets').flatten().map('instruments').flatten().value();
      return symbols;
   })
   .catch((err) =>{
      console.console(err);
      return [];
   });

const when_authenticated = () => {
   return new Promise((res) => {
      if (liveapi.is_authenticated()) {
         return res();
      }
      liveapi.events.on_till('login',() => {
         res();
         return true;
      });
   });
}
const reopen_dialogs = (symbols, saved_states) => {

   const unique_modules = {
      assetIndex: '#nav-menu .assetIndex',
      statement: '#nav-menu .statement',
      tradingTimes: '#nav-menu .tradingTimes',
      historicalData: '#nav-menu .historical-data',
      portfolio: '#nav-menu .portfolio',
      profitTable: '#nav-menu .profitTable',
      token: '#nav-menu .token-management',
      deposit: '#nav-menu .deposit',
      withdraw: '#nav-menu .withdraw',
      copyTrade: '#nav-menu .copytrade',
   };

   let counter = 0;
   const reopen = (data, module_id) => {
      if(data.position.mode === 'closed') return;

      if(data.is_unique) {
         if(data.is_authorized) {
            when_authenticated().then(() => {
               $(unique_modules[module_id]).click();
               return true; // unsubscribe from login event
            });
         }
         else {
            $(unique_modules[module_id]).click();
         }
      }
      else if(module_id === 'chartWindow') {
         const symbol = data.data.instrumentCode;
         const instrument = _.find(symbols.instruments, (i) => { return i.symbol==symbol; });
         data.data.instrumentName = instrument.display_name;
         if(symbols.length > 0 && symbols.indexOf(symbol) === -1) {
            /* Since we get the list of ins from trading_times API,
             * backend/quant might change the list of instruments they are offering.
             * We just need to make sure that those charts are not getting restored. */
            return ;
         }
         data.data.tracker_id = ++counter;
         require(['charts/chartWindow'],(chartWindow) => {
            data.data.isTrackerInitiated = true;
            chartWindow.addNewWindow(data.data);
         });
      }
      else if(module_id === 'tradeDialog') {
         when_authenticated().then(() => {
            data.data.tracker_id = ++counter;
            liveapi
               .send({contracts_for: data.data.symbol.symbol})
               .then((res) => {
                  require(['trade/tradeDialog'], (tradeDialog) => {
                     const dialog = tradeDialog.init(data.data.symbol, res.contracts_for, data.data.template, true/*isTrackerInitiated*/);
                     if(data.position.offset) {
                        const x = data.position.offset.left;
                        const y = data.position.offset.top;
                        dialog.dialog('widget').css({
                           left: x + 'px',
                           top: y + 'px'
                        });
                        dialog.trigger('animated');
                        /* update dialog option.position */
                        dialog.dialog("option", "position", { my: x, at: y });
                     }
                  });
               }).catch(console.error.bind(console));
            return true; // unsubscribe from login event
         });
      }
      else {
         console.error('unknown module_id ' + module_id);
      }
   };
   _.forEach(saved_states,(data, module_id) => {
      if(_.isArray(data))
         data.forEach((d) => reopen(d, module_id))
      else if(_.isObject(data))
         reopen(data, module_id);
   });
}

// /* avoid too many writes to local storage */
const save_states = _.debounce(() => {
   const perv_states = local_storage.get('states');
   states.name = (perv_states && perv_states.name) || states.name;
   local_storage.set('states', states)
}, 50);

const apply_saved_state = (dialog, blankWindow, state, saved_state) => {
   const pos = saved_state.position;

   pos.size && blankWindow.dialog('option', 'width', pos.size.width);
   pos.size && blankWindow.dialog('option', 'height', pos.size.height);
   state.position.size = pos.size;
   state.position.mode = pos.mode;

   if(pos.mode === 'maximized')
      setTimeout(() => {
         blankWindow.dialogExtend('maximize');
         blankWindow.dialog('moveToTop');
      }, 10);
   else if(pos.mode === 'minimized')
      blankWindow.dialogExtend('minimize');

   if(pos.offset) {
      dialog.css({
         left: pos.offset.left + 'px',
         top: pos.offset.top + 'px'
      });
      state.position.offset = pos.offset;
   }

   save_states();
}

/* options: {
 *    module_id: 'statement/statement'  // require js module id
 *    is_unique: true/false // is this dialog instance unique or not,
 *    data: { } // arbitary data object for this dialog
 * }
 * blankWindow // dialog returned from windows.createBlankWindow()
 *
 * returns: a function that can be used to update the data
 */
export const track = (options, blankWindow) => {
   const dialog = blankWindow.dialog('widget');
   let saved_state = null;
   const state = {
      module_id: options.module_id,
      is_unique: options.is_unique,
      is_authorized: blankWindow.attr('data-authorized') === 'true',
      data: options.data,
      position: {
         size: { width: blankWindow.dialog('option', 'width'), height: blankWindow.dialog('option', 'height') },
         offset: undefined,
         mode: 'normal'
      }
   };
   if(options.is_unique){
      states[options.module_id] = state;
      saved_state = saved_states[options.module_id];
      if(saved_state){
         if(saved_state.position.mode === 'closed')
            saved_state = null;
         delete saved_states[options.module_id];
      }
   }
   else {
      states[options.module_id] = states[options.module_id] || [];
      states[options.module_id].push(state);

      if(saved_states[options.module_id] && state.data.tracker_id !== undefined) {
         const inx = _.findIndex(
            saved_states[options.module_id],
            (elem) => elem.data.tracker_id === state.data.tracker_id
         );
         if(inx !== -1) {
            saved_state = saved_states[options.module_id][inx];
            saved_states[options.module_id].splice(inx, 1);
            if(saved_state.position.mode === 'closed')
               saved_state = null;
         }
      }
   }
   save_states();
   dialog.on('dragstop',() => {
      state.position.offset = dialog.offset();
      save_states();
   });
   dialog.on('animated',() => {
      state.position.offset = dialog.offset();
      save_states();
   });
   dialog.on('resizestop',(e, ui) => {
      state.position.size = ui.size;
      state.position.offset = dialog.offset();
      save_states();
   });
   blankWindow.on('dialogextendminimize',() => {
      state.position.mode = 'minimized';
      save_states();
   });
   blankWindow.on('dialogextendmaximize',() => {
      state.position.mode = 'maximized';
      save_states();
   });
   blankWindow.on('dialogextendrestore',() => {
      state.position.offset = dialog.offset();
      state.position.mode = 'normal';
      save_states();
   });
   blankWindow.on('dialogdestroy',() => {
      if(state.is_unique){
         delete states[state.module_id];
      }
      else {
         if(states[state.module_id]) { /* if not already cleared by switching between accounts */
            const inx = states[state.module_id].indexOf(state);
            if(states[state.module_id].length == 1)
               delete states[state.module_id];
            else
               states[state.module_id].splice(inx, 1);
         }
      }
      save_states();
   });
   blankWindow.on('dialogclose',() => {
      state.position.mode = 'closed';
      save_states();
   });
   blankWindow.on('dialogopen',() => {
      state.position.offset = dialog.offset();
      state.position.mode = 'normal';
      save_states();

      if(saved_state){
         apply_saved_state(dialog, blankWindow, state, saved_state);
         saved_state = null;
      }
   });


   return (data) => {
      state.data = data;
      save_states();
   };
}

export const reopen = (workspace = null) => {
   if(workspace) {
      states = workspace;
   }
   symbols_promise.then((symbols) => {
      saved_states = states;
      states = { };
      save_states();
      reopen_dialogs(symbols, saved_states);
   });
};

/* used in case of connection drops in binary_websockets onclose() function */
export const reopen_trade_dialogs = (trade_dialogs) => {
   symbols_promise.then((symbols) => {
      reopen_dialogs(symbols, {tradeDialog: trade_dialogs});
   });
};

export const get_trade_dialogs = () => _.cloneDeep(states.tradeDialog || []);

export const get_unique_dialogs = () => _.filter(states, {is_unique: true});

export const reopen_unique_dialogs = (unique_dialogs) => {
      const copy = {};
      _.forEach(unique_dialogs, data => {
            copy[data.module_id] = copy[data.module_id] || [];
            data.position.mode = 'normal';
            copy[data.module_id].push(data);
      });
      reopen_dialogs(null, copy);
} 

export const is_empty = () => {
   const ok = _.values(states).filter(
      (s) => !_.isString(s) && (_.isArray(s) || s.position.mode !== 'closed')
   );
   return ok.length === 0;
}

export default {
   track,
   reopen,
   reopen_trade_dialogs,
   get_trade_dialogs,
   is_empty,
   get_unique_dialogs,
   reopen_unique_dialogs
}
