/**
* Created by arnab on 5/12/16.
*/
define(['jquery', 'windows/windows', 'common/rivetsExtra', 'lodash', 'common/util'], function($, windows, rv, _) {
  require(['text!config/config.html']);
  require(['css!config/config.css']);

  var win = null, win_view = null;

  function initConfigWindow(root) {
    root = $(root).i18n();
    var state = init_state(root);
    win_view = rv.bind(root[0], state);

    win = windows.createBlankWindow(root, {
      title: 'Change Backend Server'.i18n(),
      resizable: false,
      collapsable: false,
      minimizable: false,
      maximizable: false,
      modal: true,
      ignoreTileAction:true,
      open: function () {
        var config = local_storage.get('config');
        if(config && config.app_id) state.app_id = config.app_id;
        if(config && config.websocket_url) state.websocket_url = _.replace(_.replace(config.websocket_url || '', 'wss://', ''), '/websockets/v3?l=EN', '');
        if(config && config.oauth_url) state.oauth_url = _.replace(_.replace(config.oauth_url || '', 'https://', ''), '/oauth2/authorize', '');
      },
      close: function() {
        win_view && win_view.unbind();
        win && win.dialog('destroy').remove();
        win_view = win = null;
      },
      buttons: [
        {
          text: 'Apply'.i18n(),
          icons: { primary: 'ui-icon-check' },
          click: state.apply
        },
        {
          text: 'Reset to Defaults'.i18n(),
          icons: { primary: 'ui-icon-refresh' },
          click: state.reset
        }
      ]
   });

    win.dialog( 'open' );
  }

  function init_state(root) {
    var state = {
      websocket_url: 'ws.binaryws.com',
      oauth_url: 'oauth.binary.com',
      app_id: ''
    };

    state.apply = function() {
      var config = {
        websocket_url: 'wss://' + state.websocket_url + '/websockets/v3?l=EN',
        oauth_url: 'https://' + state.oauth_url + '/oauth2/authorize',
        app_id: state.app_id
      }
      local_storage.set('config', config);
      state.reload_page();
    }

    state.reset = function(){
      local_storage.remove('config');
      state.reload_page();
    }

    state.reload_page = function() {
      $.growl.notice({message: 'Config changes successful.<br/>Reloading page ...'.i18n()});
      setTimeout(function(){
        window.location.reload();
      }, 900);
    }

    return state;
  }


  function init($menuLink) {
    $menuLink.click(function() {
      if (!win)
        require(['text!config/config.html'], initConfigWindow);
      else
        win.moveToTop();
    });
  }

  return { init: init }
});
