/**
 * Created by amin on May 27, 2016.
 */

define(["windows/windows", "websockets/binary_websockets", "lodash", "navigation/menu"], function (windows, liveapi, lodash, menu) {

  var states = local_storage.get('states') || { };
  var saved_states = { };

  var symbols_promise = liveapi.cached
      .send({ trading_times: new Date().toISOString().slice(0, 10) })
      .then(function(data) {
        var markets = menu.extractChartableMarkets(data);
        var symbols = _(markets).map('submarkets').flatten().map('instruments').flatten().map('symbol').value();
        return symbols;
      })
      .catch(function(err){
        console.console(err);
        return [];
      });

  function when_authenticated() {
    return new Promise(function(res) {
      if (liveapi.is_authenticated()) {
        return res();
      }
      liveapi.events.on_till('login', function() {
        res();
        return true;
      });
    });
  }
  function reopen_dialogs(symbols){
    saved_states = states;
    states = { };
    save_states();

    var unique_modules = {
      assetIndex: '#nav-container .assetIndex',
      statement: '#nav-container .statement',
      tradingTimes: '#nav-container .tradingTimes',
      download: '#nav-container .download', // view historical data
      portfolio: '#nav-container .portfolio',
      profitTable: '#nav-container .profitTable',
      token: '#nav-container .token-management',
      deposit: '#nav-container .deposit',
      withdraw: '#nav-container .withdraw',
    };

    var counter = 0;
    var reopen = function(data, module_id) {
      if(data.position.mode === 'closed') return;

      if(data.is_unique) {
        if(data.is_authorized) {
          when_authenticated().then(function(){
            $(unique_modules[module_id]).click();
            return true; // unsubscribe from login event
          });
        }
        else {
          $(unique_modules[module_id]).click();
        }
      }
      else if(module_id === 'chartWindow') {
        var symbol = data.data.instrumentCode;
        if(symbols.length > 0 && symbols.indexOf(symbol) === -1) {
         /* Since we get the list of ins from trading_times API,
          * backend/quant might change the list of instruments they are offering.
          * We just need to make sure that those charts are not getting restored. */
          return ;
        }
        data.data.tracker_id = ++counter;
        require(['charts/chartWindow'], function(chartWindow) {
          chartWindow.addNewWindow(data.data);
        });
      }
      else if(module_id === 'tradeDialog') {
        when_authenticated().then(function() {
          data.data.tracker_id = ++counter;
          liveapi
              .send({contracts_for: data.data.symbol})
              .then(function (res) {
                  require(['trade/tradeDialog'], function (tradeDialog) {
                      tradeDialog.init(data.data, res.contracts_for);
                  });
              }).catch(console.error.bind(console));
          return true; // unsubscribe from login event
        });
      }
      else {
        console.error('unknown module_id ' + module_id);
      }
    };
    _.forEach(saved_states, function(data, module_id) {
      if(_.isArray(data))
        data.forEach(function(d){
          reopen(d, module_id);
        })
      else
        reopen(data, module_id);
    });
  }

  // /* avoid too many writes to local storage */
  var save_states = _.debounce(function(){
    local_storage.set('states', states);
  }, 50);

  function apply_saved_state(dialog, blankWindow, state, saved_state){
      var pos = saved_state.position;

      pos.size && blankWindow.dialog('option', 'width', pos.size.width);
      pos.size && blankWindow.dialog('option', 'height', pos.size.height);
      state.position.size = pos.size;
      state.position.mode = pos.mode;

      if(pos.mode === 'maximized')
        setTimeout(function(){
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
  function track(options, blankWindow) {
    var dialog = blankWindow.dialog('widget');
    var saved_state = null;
    var state = {
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
        var inx = _.findIndex(saved_states[options.module_id], function(elem){
          return elem.data.tracker_id === state.data.tracker_id;
        });
        if(inx !== -1) {
          saved_state = saved_states[options.module_id][inx];
          saved_states[options.module_id].splice(inx, 1);
          if(saved_state.position.mode === 'closed')
            saved_state = null;
        }
      }
    }
    save_states();
    dialog.on('dragstop', function(){
      state.position.offset = dialog.offset();
      save_states();
    });
    dialog.on('animated', function(){
        state.position.offset = dialog.offset();
        save_states();
    });
    dialog.on('resizestop', function(e, ui){
      state.position.size = ui.size;
      state.position.offset = dialog.offset();
      save_states();
    });
    blankWindow.on('dialogextendminimize', function(){
      state.position.mode = 'minimized';
      save_states();
    });
    blankWindow.on('dialogextendmaximize', function(){
      state.position.mode = 'maximized';
      save_states();
    });
    blankWindow.on('dialogextendrestore', function(){
      state.position.offset = dialog.offset();
      state.position.mode = 'normal';
      save_states();
    });
    blankWindow.on('dialogdestroy', function(){
      if(state.is_unique){
        delete states[state.module_id];
      }
      else{
        var inx = states[state.module_id].indexOf(state);
        if(states[state.module_id].length == 1)
          delete states[state.module_id];
        else
          states[state.module_id].splice(inx, 1);
      }
      save_states();
    });
    blankWindow.on('dialogclose', function(){
      state.position.mode = 'closed';
      save_states();
    });
    blankWindow.on('dialogopen', function(){
      state.position.offset = dialog.offset();
      state.position.mode = 'normal';
      save_states();

      if(saved_state){
        apply_saved_state(dialog, blankWindow, state, saved_state);
        saved_state = null;
      }
    });


    return function(data) {
      state.data = data;
      save_states();
    };
  }

  return {
    track: track,
    reopen: function() {
      symbols_promise.then(reopen_dialogs);
    },
    is_empty: function(){
      var ok = _.values(states).filter(function(s) {
        return _.isArray(s) || s.position.mode !== 'closed';
      });
      return ok.length === 0;
    }
  }
});
