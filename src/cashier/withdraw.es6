/*
 * Created by amin on July 16, 2016.
 */

define(['jquery', 'websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'lodash', 'moment'], function($, liveapi, windows, rv, _, moment) {
    require(['text!cashier/withdraw.html']);
    require(['css!cashier/withdraw.css']);
    var win = null;
    var win_view = null; // rivets view

    var error_handler = function(err) {
      console.error(err);
      $.growl.error({ message: err.message });
    };

    function init(li) {
      li.click(function () {
          if(!win)
            require(['text!cashier/withdraw.html'], init_withdraw_win);
          else
            win.moveToTop();
      });
    }

    function init_withdraw_win(root) {
      root = $(root);
      win = windows.createBlankWindow(root, {
          title: 'Withdraw funds',
          resizable: true,
          collapsable: false,
          minimizable: true,
          maximizable: true,
          width: 700,
          height: 600,
          'data-authorized': true,
          close: function () {
            win.dialog('destroy');
            win.trigger('dialogclose'); // TODO: figure out why event is not fired.
            win.remove();
            win = null;
          },
          open: function () { },
          destroy: function() {
            win_view && deposit_win_view.unbind();
            win_view = null;
          }
      });

      init_state(root);
      win.dialog('open');

      /* update dialog position, this way when dialog is resized it will not move*/
      var offset = win.dialog('widget').offset();
      offset.top = 110;
      win.dialog("option", "position", { my: offset.left, at: offset.top });
      win.dialog('widget').css({
          left: offset.left + 'px',
          top: offset.top + 'px'
      });
      win.fixFooterPosition();
      win.track({
        module_id: 'withdraw',
        is_unique: true
      });
    }

    function init_state(root) {
      var app_id = liveapi.app_id;
      var state = {
        route: { value: 'menu'},
        empty_fields: {
          validate: false,
          clear: _.debounce(function() {
            state.empty_fields.validate = false;
          }, 4000),
          show: function() {
            state.empty_fields.validate = true;
            state.empty_fields.clear();
          }
        },
        menu: { },
      };

      state.route.update = function(route) {
        state.route.value = route;
      };

      deposit_win_view = rv.bind(root[0], state);
    }

    return {
      init: init
    }
});
