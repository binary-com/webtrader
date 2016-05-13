
define(['websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'lodash'], function(liveapi, windows, rv, _) {
    require(['text!token/token.html']);
    require(['css!token/token.css']);
    var token_win = null;
    var token_win_view = null;

    function init($menuLink) {
      $menuLink.click(function () {
          if (!token_win)
              require(['text!token/token.html'], initTokenWin);
          else
              token_win.moveToTop();
      });
    }

    function initTokenWin(root) {
      root = $(root);
      token_win = windows.createBlankWindow(root, {
          title: 'Token management',
          resizable: false,
          collapsable:false,
          minimizable: true,
          maximizable: false,
          width: 700,
          minHeight: 60,
          close: function () { },
          open: function () { },
          destroy: function() {
            token_win_view && token_win_view.unbind();
            token_win_view = null;
          }
      });
      token_win.dialog('open');
      window.tkn = token_win;
    }

    return {
      init: init
    }
});
