/*
 * Created by amin on May 1, 2016.
 */

define(['websockets/binary_websockets', 'windows/windows'], function(liveapi, windows) {
    var login_win = null;

    function init() {
      if(login_win){
        login_win.moveToTop();
        return;
      }

      login_win = windows.createBlankWindow($('<div/>'), {
          title: 'Log in',
          // width: 700,
          // minHeight: 60,
          close: function () {
          },
          open: function () {
          },
          destroy: function() {
          }
      });

      login_win.dialog('open');
    }

    return {
      init: init
    }
});
