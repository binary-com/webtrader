define(['jquery', 'websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'text!cashier/currency.html'], function($, liveapi, windows, rv, html) {
    require(['text!cashier/currency.html']);

    var check_promise = null;
    var check_currency = () => new Promise((resolve, reject) => {
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
            ignoreTileAction:true,
            close: () => {
              win.dialog('destroy');
              win.remove();
              win = null;
            },
            destroy: () => {
              win_view && win_view.unbind();
              win_view = null;
            }
        });

        var state = {
          disabled: false,
          value: 'USD',
          array: ['USD', 'EUR', 'GBP', 'AUD'],
          continue: () => {
            state.disabled = true;
            liveapi.send({ set_account_currency: state.value })
              .then(resolve, reject)
              .then(() => win.dialog('close'));
          },
          cancel: () => {
            win.dialog('close');
            reject({ message: 'Please set currency.'.i18n() });
          }
        };

        var win_view = rv.bind($html[0], state);
        win.dialog('open');
    });

    return {
      check_currency: () => {
        if(check_promise) { return check_promise; }
        check_promise = check_currency().catch(up => {
          check_promise = null;
          throw up;
        });
        return check_promise;
      }
    }
});
