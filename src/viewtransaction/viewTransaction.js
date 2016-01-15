/**
 * Created by amin on January 14, 2016.
 */

define(["jquery", "windows/windows", "websockets/binary_websockets", "common/rivetsExtra", "jquery-growl", 'common/util'],
  function($, windows, liveapi, rv){

  require(['css!viewtransaction/viewTransaction.css']);
  require(['text!viewtransaction/viewTransaction.html']);

  /* params : { symbol: ,contract_id: ,longcode: ,sell_time: ,
                purchase_time: ,buy_price: ,sell_price: } */
  function init(params) {
    require(['text!viewtransaction/viewTransaction.html'],function(html){
        var root = $(html);
        var transWin = windows.createBlankWindow(root, {
            title: 'Transaction ' + params.contract_id, /* TODO: use symbol_name instead */
            width: 700,
            minHeight:90,
            destroy: function() { },
            close: function() { view.unbind(); },
            'data-authorized': 'true'
        });

        var state = init_state(params);
        var view = rv.bind(root[0],state)

        transWin.dialog('open');
    })
  }

  function init_state(params){
      var state = {
          route: {
              value: 'explanation',
              update: function(value) { state.route.value = value; }
          },
          longcode: params.longcode,
      };

      return state;
  }

  return { init: init };
});
