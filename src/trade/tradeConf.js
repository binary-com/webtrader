/*
 * Created by amin on December 4, 2015.
 */

define(['lodash', 'jquery', 'websockets/binary_websockets', 'common/rivetsExtra', 'text!trade/tradeConf.html', 'css!trade/tradeConf.css' ],
  function(_, $, liveapi, rv, html){

    function register_ticks(state, passthrough){
      var digits_count = passthrough.digits_count * 1,
          symbol = passthrough.symbol,
          purchase_epoch = state.buy.purchase_time * 1;

      liveapi.events.on('tick', function (data) {
          if (digits_count === 0 || !data.tick || data.tick.symbol !== symbol || data.tick.epoch * 1 < purchase_epoch)
            return;
          state.ticks.array.push(data.tick);
          console.warn(state.ticks.array);
          --digits_count;
      });
    }

    function init(data, show_callback){
      var root = $(html);
      var buy = data.buy,
          passthrough = data.echo_req.passthrough;
      var state = {
        title: {
          text: 'Contract Confirmation',
        },
        buy: {
          message: buy.longcode,
          balance_after: buy.balance_after,
          buy_price: buy.buy_price,
          purchase_time: buy.purchase_time,
          start_time: buy.start_time,
          transaction_id: buy.transaction_id,
          payout_amount: passthrough.payout_amount,
          currency: passthrough.currency,
          potential_profit : passthrough.payout_amount - buy.buy_price,
        },
        ticks: {
            array: [],
            value: passthrough.digits_value * 1 || '0', // last digit value selected by the user
        },
        arrow: { }
      };

      if(passthrough.category === 'Digits') {
          register_ticks(state,passthrough);
      }

      console.warn(buy,passthrough);
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
