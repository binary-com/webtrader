/*
 * Created by amin on December 4, 2015.
 */

define(['jquery', 'common/rivetsExtra', 'text!trade/tradeConf.html', 'css!trade/tradeConf.css' ],
  function($, rv, html){

    function init(data, show_callback){
      var root = $(html);
      var state = {
        title: {
          text: 'Contract Confirmation',
        },
        buy: {
          message: data.longcode,
          balance_after: data.balance_after,
          buy_price: data.buy_price,
          purchase_time: data.purchase_time,
          start_time: data.start_time,
          transaction_id: data.transaction_id,
          payout_amount: data.payout_amount,
          currency: data.currency,
          potential_profit : data.payout_amount - data.buy_price,
        },
        arrow: { }
      };
      state.arrow.onclick = function(){
         $.growl.error({ message: 'Not implement yet!' });
      };
      var view = rv.bind(root[0], state)
      show_callback(root);
    }

    return {
      init: init
    }
});
