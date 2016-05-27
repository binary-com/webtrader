/**
 * Created by amin on May 27, 2016.
 */

define(["windows/windows", "websockets/binary_websockets", "lodash"], function (windows, liveapi, lodash) {

  var states = local_storage.get('states') || { };
  var saved_states = { };

  function reopen_dialogs(){
    saved_states = states;
    states = { };
    save_states();

    var unique_modules = {
      statement: function(data){
        $('#nav-container .statement').click();
      }
    };

    var counter = 0;
    var reopen = function(data, module_id) {
      if(data.position.mode === 'closed') return;

      if(data.is_unique) {
        if(data.is_authorized) {
          liveapi.events.on_till('login', function(){
            unique_modules[module_id](data);
            return true; // unsubscribe from login event
          });
        }
        else { unique_modules[module_id](data); }
      }
      else if(module_id === 'chartWindow') {
        data.data.tracker_id = ++counter;
        require(['charts/chartWindow'], function(chartWindow) {
          chartWindow.addNewWindow(data.data);
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
  // var save_states = _.debounce(function(){
  //   console.warn(JSON.stringify(states));
  //   local_storage.set('states', states);
  // }, 10);
  var save_states = function() {
    console.warn(JSON.stringify(states));
    local_storage.set('states', states);
  };

  function apply_saved_state(dialog, blankWindow, state, saved_state){
      var pos = saved_state.position;

      pos.size && blankWindow.dialog('option', 'width', pos.size.width);
      pos.size && blankWindow.dialog('option', 'height', pos.size.height);
      state.position.size = pos.size;
      save_states();

      pos.offset && dialog.animate({
        left: pos.offset.left + 'px',
        top: pos.offset.top + 'px'
      }, 500, dialog.trigger.bind(dialog, 'animated'));
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
    reopen: reopen_dialogs,
    is_empty: function(){
      return _.size(states) === 0;
    }
  }
});
