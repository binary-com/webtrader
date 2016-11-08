'use strict';

define(['jquery', 'websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'text!cashier/currency.html'], function ($, liveapi, windows, rv, html) {
  require(['text!cashier/currency.html']);

  var check_promise = null;
  var _check_currency = function _check_currency() {
    return new Promise(function (resolve, reject) {
      var $html = $(html);
      var win = windows.createBlankWindow($html, {
        dialogClass: "dialog-confirm",
        width: 500,
        height: 230,
        resizable: false,
        collapsable: false,
        minimizable: false,
        maximizable: false,
        modal: true,
        ignoreTileAction: true,
        close: function close() {
          win.dialog('destroy');
          win.remove();
          win = null;
        },
        destroy: function destroy() {
          win_view && win_view.unbind();
          win_view = null;
        }
      });

      var state = {
        disabled: false,
        value: 'USD',
        array: ['USD', 'EUR', 'GBP', 'AUD'],
        continue: function _continue() {
          state.disabled = true;
          liveapi.send({ set_account_currency: state.value }).then(resolve, reject).then(function () {
            return win.dialog('close');
          });
        },
        cancel: function cancel() {
          win.dialog('close');
          reject({ message: 'Please set currency.'.i18n() });
        }
      };

      var win_view = rv.bind($html[0], state);
      win.dialog('open');
    });
  };

  return {
    check_currency: function check_currency() {
      if (check_promise) {
        return check_promise;
      }
      check_promise = _check_currency().catch(function (up) {
        check_promise = null;
        throw up;
      });
      return check_promise;
    }
  };
});
//# sourceMappingURL=currency.js.map
