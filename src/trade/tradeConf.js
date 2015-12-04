/*
 * Created by amin on December 4, 2015.
 */

define(['jquery', 'common/rivetsExtra', 'text!trade/tradeConf.html', 'css!trade/tradeConf.css' ],
  function($, rv, html){

    function init(show){
      var root = $(html);
      show(root);
    }

    return {
      init: init
    }
});
