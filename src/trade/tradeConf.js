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
      };
      var view = rv.bind(root[0], state)
      show(root);
    }

    return {
      init: init
    }
});
