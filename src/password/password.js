/*
 * Created by amin on May 19, 2016.
 */

define(['websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra'], function(liveapi, windows, rv) {
    require(['text!password/password.html']);
    require(['css!password/password.css']);
    var password_win = null;
    var password_win_view = null;

    function init($menuLink) {
      $menuLink.click(function () {
        if (!password_win)
          require(['text!password/password.html'], init_passowrd_win);
        else
          password_win.moveToTop();
      });
    }

    function init_passowrd_win(root) {
      root = $(root);
      password_win = windows.createBlankWindow(root, {
          title: 'Change password',
          resizable:false,
          collapsable:false,
          minimizable: false,
          maximizable: false,
          // width: 408,
          // height: 150,
          'data-authorized': true,
          close: function () {
            password_win.dialog('destroy');
            password_win.remove();
            password_win = null;
          },
          open: function () { },
          destroy: function() {
            password_win_view && password_win_view.unbind();
            password_win_view = null;
          }
      });

      init_state(root);
      password_win.dialog('open');
    }

    function init_state(root) {
      var state = {

      };

      password_win_view = rv.bind(root[0], state);
    }

    return {
      init: init
    }
});
