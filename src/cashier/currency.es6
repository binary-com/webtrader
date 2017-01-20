import $ from 'jquery';
import liveapi from 'websockets/binary_websockets';
import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import html from 'text!cashier/currency.html';

require(['common/util'])
require(['text!cashier/currency.html']);

let check_promise = null;
const check_currency_async = () => new Promise((resolve, reject) => {
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
      disabled: true,
      value: 'Select a value',
      array: ['Select a value'],
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

    const oauth = local_storage.get("oauth")[0];
    $.extend(oauth, {
      is_mf: /MF/gi.test(oauth.id),
      is_mlt: /MLT/gi.test(oauth.id),
      is_mx: /MX/gi.test(oauth.id),
      is_cr: /CR/gi.test(oauth.id)
    });

    liveapi.cached.send({payout_currencies:1}).then((data) => {
      state.disabled = false;
      state.array = data.payout_currencies;
      state.value = oauth.is_mx ? 'GBP' : oauth.is_mf || oauth.is_mlt ? 'EUR' : data.payout_currencies[0];
    }).catch(()=> reject({message: 'Please try again after few minutes.'.i18n()}));

    var win_view = rv.bind($html[0], state);
    win.dialog('open');
});

export const check_currency = () => {
  if(check_promise) { return check_promise; }
  check_promise = check_currency_async().catch(up => {
    check_promise = null;
    throw up;
  });
  return check_promise;
}

export default {
  check_currency
}
