/*
 * Created by amin on June 26, 2016.
 */

define(['jquery', 'websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'lodash', 'moment'], function($, liveapi, windows, rv, _, moment) {
    require(['text!cashier/deposit.html']);
    require(['css!cashier/deposit.css']);
    var deposit_win = null;
    var deposit_win_view = null; // rivets view

    var error_handler = function(err) {
      console.error(err);
      $.growl.error({ message: err.message });
    };

    function init(li) {
      li.click(function () {
          if(!deposit_win)
            require(['text!cashier/deposit.html'], init_deposit_win);
          else
            deposit_win.moveToTop();
      });
    }

    function init_deposit_win(root) {
      root = $(root);
      deposit_win = windows.createBlankWindow(root, {
          title: 'Deposit funds',
          resizable:false,
          collapsable:false,
          minimizable: true,
          maximizable: false,
          width: 700,
          height: 800,
          close: function () {
            deposit_win.dialog('destroy');
            deposit_win.trigger('dialogclose'); // TODO: figure out why event is not fired.
            deposit_win.remove();
            deposit_win = null;
          },
          open: function () { },
          destroy: function() {
            deposit_win_view && deposit_win_view.unbind();
            deposit_win_view = null;
          }
      });

      init_state(root);
      deposit_win.dialog('open');

      /* update dialog position, this way when dialog is resized it will not move*/
      var offset = deposit_win.dialog('widget').offset();
      offset.top = 110;
      deposit_win.dialog("option", "position", { my: offset.left, at: offset.top });
      deposit_win.dialog('widget').css({
          left: offset.left + 'px',
          top: offset.top + 'px'
      });
      deposit_win.fixFooterPosition();
    }

    function init_state(root) {
      var app_id = liveapi.app_id;
      var state = {
        route: { value: 'standard-methods'}, // routes: ['standard-methods', 'payment-agents']
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
        user: {
          residence: '',
          residence_name: ''
        }

      };

      state.route.update = function(route){
        var routes = {
          'standard-methods' : 800,
          'payment-agents': 800,
        };
        state.route.value = route;
        deposit_win.dialog('option', 'height', routes[route]);
        deposit_win.dialog('widget').trigger('dialogresizestop');
      };

      deposit_win_view = rv.bind(root[0], state);

      /* get the residence field and its states */
      var residence_promise = liveapi.send({get_settings: 1})
             .then(function(data){
               state.user.residence = data.get_settings.country_code;
               state.user.residence_name = data.get_settings.country;
               console.warn(state.user.residence);
             })
             .catch(error_handler);
    }

    return {
      init: init
    }
});
