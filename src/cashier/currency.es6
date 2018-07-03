import $ from 'jquery';
import liveapi from 'websockets/binary_websockets';
import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import html from 'text!cashier/currency.html';
import _ from 'lodash';

require(['common/util']);

let check_promise = null;
const check_currency_async = () => new Promise((resolve, reject) => {
  var $html = $(html);
  var win = windows.createBlankWindow($html, {
    dialogClass: "dialog-confirm",
    width: 500,
    height: 210,
    resizable: false,
    collapsable: false,
    minimizable: false,
    maximizable: false,
    modal: true,
    ignoreTileAction: true,
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
        .then(() => {
          // This doesn't work because on emitting the login event currency is reset.
          // local_storage.set("currency", state.value);
          const oauth = local_storage.get('oauth');
          oauth[0].currency = state.value;
          local_storage.set("oauth", oauth);
          //Re-authorize
          liveapi.cached.authorize(true)
          win.dialog('close');
        })
        .catch((err) => {
          reject();
          win.dialog('close');
          $.growl.error({ message: err.message });
        });
    },
    cancel: () => {
      reject();
      win.dialog('close');
      $.growl.notice({ message: 'Please set currency.'.i18n() });
    }
  };

  liveapi.cached.send({ payout_currencies: 1 }).then((data) => {
    state.disabled = false;
    state.array = [];
    data.payout_currencies.forEach((currency) => {
      const config = local_storage.get("currencies_config") || {};
      const currency_obj = {
        value: currency,
        type: config[currency] ? config[currency].type : ''
      };
      state.array.push(currency_obj);
    });
    state.categories = _.uniqBy(state.array, "type").map((e) => e.type);
    state.value = data.payout_currencies[0];
  }).catch(() => reject({ message: 'Please try again after few minutes.'.i18n() }));

  rv.formatters.format_category = (category) => {
    return _.capitalize(category) + " Currencies"
  };

  var win_view = rv.bind($html[0], state);
  win.dialog('open');
});

export const check_currency = () => {
  if (check_promise) { return check_promise; }
  check_promise = check_currency_async().then(() => check_promise = null).catch((err) => {
    check_promise = null;
  });
  return check_promise;
}

export default {
  check_currency
}
