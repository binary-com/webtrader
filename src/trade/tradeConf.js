/*
 * Created by amin on December 4, 2015.
 */

define(['jquery', 'common/rivetsExtra', 'text!trade/tradeConf.html', 'css!trade/tradeConf.css' ],
  function($, rv, html){

    function init(show){
      var root = $(html);
      var state = {
        title: {
          text: 'Contract Confirmation',
        },
        buy: {
          message: 'USD 5.15 USD 10.00 payout if Random 100 Index is strictly higher than entry spot at 1 minute after contract start time.'
        }
      };
      var view = rv.bind(root[0], state)
      show(root);
    }

    return {
      init: init
    }
});
