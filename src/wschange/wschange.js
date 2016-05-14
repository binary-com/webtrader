/**
* Created by arnab on 5/12/16.
*/
define(['jquery', 'windows/windows', 'lodash', 'common/util'], function($, windows, _) {
  require(['text!wschange/wschange.html']);
  require(['css!wschange/wschange.css']);

  var win = null, confirm = null;

  function apply() {  }
  function reset() { }

  function initWsChangeWindow(root) {
    root = $(root);

    win = windows.createBlankWindow(root, {
      title: 'Change Backend Server',
      resizable: false,
      collapsable: false,
      minimizable: false,
      maximizable: false,
      modal: true,
      ignoreTileAction:true,
      'data-authorized': 'true',
      open: function () {
        var storedWsURL = local_storage.get('websocket_url');
        var api_url = (storedWsURL && storedWsURL.url)  || 'wss://ws.binaryws.com/websockets/v3?l=EN';
        root.find('input').val(api_url);
      },
      close: function() {
        win && win.dialog('destroy').remove();
        win = null;
      },
      buttons: [
        {
          text: 'Apply',
          icons: { primary: 'ui-icon-check' },
          click: apply
        },
        {
          text: 'Reset default',
          icons: { primary: 'ui-icon-refresh' },
          click: reset
        }
      ]
   });

    win.dialog( 'open' );
  }


  function init($menuLink) {
    $menuLink.click(function() {
      if (!win)
        require(['text!wschange/wschange.html'], initWsChangeWindow);
      else
        win.moveToTop();
    });
  }

  return { init: init }
});
