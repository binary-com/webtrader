/*
 * Created by amin on December 4, 2015.
 */

define(['lodash', 'jquery', 'websockets/binary_websockets', 'common/rivetsExtra', 'text!trade/tradeConf.html', 'css!trade/tradeConf.css' ],
  function(_, $, liveapi, rv, html){

    /* called when the last tick have been received for 'Digits' or 'Up/Down' contracts */
    function ticks_done(state, last_tick) {
      var category = state.ticks.category,
          display = state.ticks.category_display;
      var css = {
            Digits: {
              matches: function(quote,expected) { return _.last(quote) === expected;},
              differs: function(quote,expected) { return _.last(quote) !== expected;}
            },
            'Up/Down': {
              rise: function(quote,expected) { return quote*1 > expected*1; },
              fall: function(quote,expected) { return quote*1 < expected*1; }
            }
          };
        /* set the css class */
        state.ticks.status = css[category][display](last_tick.quote, state.ticks.digits_value) ? 'won' : 'lost';
    }

    function register_ticks(state, passthrough){
      var digits_count = passthrough.digits_count * 1,
          symbol = passthrough.symbol,
          purchase_epoch = state.buy.purchase_time * 1;

      state.ticks.active = true;
      liveapi.events.on('tick', function (data) {
          if (digits_count === 0 || !data.tick || data.tick.symbol !== symbol || data.tick.epoch * 1 < purchase_epoch)
            return;
          var tick = data.tick;
          state.ticks.array.push({quote: tick.quote, epoch: tick.epoch, number: state.ticks.array.length+1 });
          --digits_count;
          if(digits_count === 0) {
              ticks_done(state, _.last(state.ticks.array));
          }
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
            category: passthrough.category,
            category_display: passthrough.category_display,
            status: 'waiting', /* could be 'waiting', 'lost' or 'won' */
            active: false,
        },
        arrow: { }
      };

      state.title.update = function() {
        state.title.text = { waiting: 'Contract Confirmation',
                              won : 'This contract won',
                              lost: 'This contract lost'
                            }[state.ticks.status];
      };

      if(_(['Digits','Up/Down']).contains(passthrough.category)) {
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
