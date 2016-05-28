/**
 * Created by arnab on 2/11/15.
 */

requirejs.config({
    baseUrl: ".",
    paths: {
        'jquery': "lib/jquery/dist/jquery.min",
        'jquery-ui': "lib/jquery-ui/jquery-ui.min",
        'highstock': "lib/highstock/highstock",
        'highcharts-more': "lib/highstock/highcharts-more",
        'highcharts-exporting': 'lib/highstock/modules/offline-exporting',
        'jquery.dialogextend' : "lib/binary-com-jquery-dialogextended/jquery.dialogextend.min",
        'jquery-growl': "lib/growl/javascripts/jquery.growl",
        'jquery-validation': "lib/jquery-validation/dist/jquery.validate.min",
        'modernizr': 'lib/modernizr/modernizr',
        'lokijs': 'lib/lokijs/build/lokijs.min',
        'color-picker': "lib/colorpicker/jquery.colorpicker",
        'datatables': "lib/datatables/media/js/jquery.dataTables.min",
        //TODO find out whats the advantage of using datatables-jquery-ui
        'datatables-jquery-ui': 'lib/datatables/media/js/dataTables.jqueryui.min',
        'currentPriceIndicator': 'charts/indicators/highcharts_custom/currentprice',
        'es6-promise':'lib/es6-promise/promise.min',
        'rivets': 'lib/rivets/dist/rivets.min',
        'sightglass': 'lib/sightglass/index',
        'timepicker': 'lib/binary-com-jquery-ui-timepicker/jquery.ui.timepicker',
        'lodash': 'lib/lodash/dist/lodash.min',
        'jquery-sparkline': 'lib/jquery-sparkline/dist/jquery.sparkline.min',
        'moment': 'lib/moment/min/moment.min',
        'ddslick': 'lib/ddslick/jquery.ddslick.min',
        'clipboard': 'lib/clipboard/dist/clipboard.min',
        "indicator_levels" : 'charts/indicators/level',
        'paralleljs' : 'lib/parallel.js/lib/parallel'
    },
    map: {
        '*': {
            'css': 'lib/require-css/css.min',
            'text': 'lib/text/text.js'
        }
    },
    waitSeconds: 0, /* fix for requriejs timeout on slow internet connectins */
    "shim": {
        "websockets/binary_websockets": {
          deps:[('Promise' in window && 'reject' in window.Promise && 'all' in window.Promise) ? '' : 'es6-promise']
        },
        "timepicker": {
            deps:['css!lib/binary-com-jquery-ui-timepicker/jquery.ui.timepicker.css','jquery-ui', 'jquery']
        },
        "jquery-ui": {
            deps: ["jquery"]
        },
        "highstock": {
            deps: ["jquery"]
        },
        "highcharts-exporting": {
            deps: ["highstock", 'lib/highstock/modules/exporting']
        },
        "jquery-growl": {
            deps: ["jquery"]
        },
        "datatables": {
            deps: ["jquery-ui"]
        },
        "currentPriceIndicator": {
            deps: ["highstock"]
        },
        sightglass : { //fix for rivets not playing nice with requriejs (https://github.com/mikeric/rivets/issues/427)
            exports: 'sightglass'
        },
        rivets : {
            deps : ['sightglass'],
            exports : 'rivets'
        },
        "highcharts-more": {
            deps: ["highstock"]
        }
    }
});

/* Initialize the websocket as soon as posssilbe */
require(['websockets/binary_websockets','text!oauth/app_id.json']);

require(["jquery", "modernizr", "common/util"], function( $ ) {

    "use strict";

    //By pass touch check for affiliates=true(because they just embed our charts)
    if (!Modernizr.svg || !Modernizr.websockets || (Modernizr.touch && isSmallView() && getParameterByName("affiliates") !== 'true') || !Modernizr.localstorage || !Modernizr.webworkers) {
      window.location.href = 'unsupported_browsers/unsupported_browsers.html';
      return;
    }

    /* Trigger *Parallel* loading of big .js files,
       Suppose moudle X depends on lib A and module Y depends on lib B,
       When X loads it will trigger loading Y, which results in loading A and B Sequentially,

       We know that A and B should eventually be loaded, so trigger loading them ahead of time. */
    require(['jquery-ui', 'highstock', 'lokijs']);


    /* main.css overrides some classes in jquery-ui.css, make sure to load it after jquery-ui.css file */
    require(['css!lib/jquery-ui/themes/smoothness/jquery-ui.min.css', 'css!lib/jquery-ui-iconfont/jquery-ui.icons.css', 'css!main.css'])

    // load jq-ui & growl stylesheets.
    require(['css!lib/growl/stylesheets/jquery.growl.css']);

    function handle_affiliate_route() {
        require(['affiliates/affiliates'], function(affiliates) {
            affiliates.init();
        });
    }

    function handle_normal_route() {
        /* this callback is executed right after the navigation module
           has been loaded & initialized. register your menu click handlers here */
        var registerMenusCallback = function ($navMenu) {

            //Register async loading of tradingTimes sub-menu
            load_ondemand($navMenu.find("a.tradingTimes"), 'click','Loading Trading Times ...', 'tradingtimes/tradingTimes', function (tradingTimes) {
                var elem = $navMenu.find("a.tradingTimes");
                tradingTimes.init(elem);
                elem.click();
            });

            //Register async loading of token-management sub-menu
            load_ondemand($navMenu.find("a.token-management"), 'click','Loading Token management ...', 'token/token', function (tokenMangement) {
                var elem = $navMenu.find("a.token-management");
                tokenMangement.init(elem);
                elem.click();
            });

            //Register async loading of change-password sub-menu
            load_ondemand($navMenu.find("a.change-password"), 'click','Loading Password dialog ...', 'password/password', function (password) {
                var elem = $navMenu.find("a.change-password");
                password.init(elem);
                elem.click();
            });

            //Register async loading of window asset-index
            load_ondemand($navMenu.find("a.assetIndex"), 'click', 'loading Asset Index ...', 'assetindex/assetIndex',
                function (assetIndex) {
                    var elem = $navMenu.find("a.assetIndex");
                    assetIndex.init(elem);
                    elem.click();
                });

            //Register async loading of portfolio window
            load_ondemand($navMenu.find("a.portfolio"), 'click', 'loading portfolio ...', 'portfolio/portfolio',
                function (portfolio) {
                    var elem = $navMenu.find("a.portfolio");
                    portfolio.init(elem);
                    elem.click();
                });

            //Register async loading of window profit-table
            load_ondemand($navMenu.find("a.profitTable"), 'click', 'loading Profit Table ...', 'profittable/profitTable',
                function (profitTable) {
                    var elem = $navMenu.find("a.profitTable");
                    profitTable.init(elem);
                    elem.click();
                });

            //Register async loading of statement dialog
            load_ondemand($navMenu.find("a.statement"), 'click', 'loading Statement Table ...', 'statement/statement',
                function (statement) {
                    var elem = $navMenu.find("a.statement");
                    statement.init(elem);
                    elem.click();
                });

            //Register async loading of download dialog
            load_ondemand($navMenu.find("a.download"), 'click', 'loading Download/View Data ...', 'download/download',
                function (download) {
                    var elem = $navMenu.find("a.download");
                    download.init(elem);
                    elem.click();
                });

            //Register async loading of self-exclusion dialog
            load_ondemand($navMenu.find("a.selfexclusion"), 'click', 'loading Self-Exclusion ...', 'selfexclusion/selfexclusion',
                function (selfexclusion) {
                    var elem = $navMenu.find("a.selfexclusion");
                    selfexclusion.init(elem);
                    elem.click();
                });

            //Register async loading of config dialog
            load_ondemand($navMenu.find("a.config"), 'click', 'loading Configurations ...', 'config/config',
                function (config) {
                    var elem = $navMenu.find("a.config");
                    config.init(elem);
                    elem.click();
                });

        }

        require(["navigation/navigation","jquery-ui"], function (navigation) {
            navigation.init(registerMenusCallback);

            /* initialize the top menu because other dialogs
             * will assume an initialized top menu */
            $("#menu").menu();

            //Trigger async loading of instruments and trade menu and refresh
            require(["instruments/instruments", "trade/tradeMenu", "jquery-growl"], function (instruments, trade) {
                $.growl.notice({ message: "Loading chart and trade menus ..." });

                instruments.init();
                trade.init();
            });

            //Trigger async loading of window sub-menu
            require(["windows/windows"], function( windows ) {
                var $windowsLI = $("#nav-menu .windows");
                windows.init($windowsLI);
                // hide the main loading spinner,
                // after the `last module` has been loaded.
                $(".sk-spinner-container").hide();
                // show the footer
                windows.fixFooterPosition();
                $('body > .footer').show();
            });
        });

        /*Trigger T&C check, self-exclusion, reality check, chrome extension check*/
        require(['selfexclusion/selfexclusion', 'chrome/chrome', 'tc/tc', 'realitycheck/realitycheck']);
    }


    if (getParameterByName("affiliates") == 'true')  //Our chart is accessed by other applications
        handle_affiliate_route();
    else {
        //Our chart is accessed directly
        handle_normal_route();
    }

    //load all other .css files asynchronously
    require([
        'css!lib/hamburger.css',
        'css!charts/charts.css',
        'css!lib/datatables/media/css/jquery.dataTables.min.css',
        'css!lib/datatables/media/css/dataTables.jqueryui.min.css',
        'css!lib/colorpicker/jquery.colorpicker.css'
    ], function() {

        if (getParameterByName("gtm") === 'true'
                            || getParameterByName("gtm") === undefined
                            || $.trim(getParameterByName("gtm")).length <= 0) {
            require(['gtm/gtm'], function (gtm) {
                gtm.init();
            });
        }

    });

});


/* example: load_ondemand(li,'click','tradingtimes/tradingtimes',callback) */
function load_ondemand(element, event_name,msg, module_name, callback) {
    var func_name = null;
    element.one(event_name, func_name = function () {

        //Ignore click event, if it has disabled class
        if (element.hasClass('disabled')) {
            element.one(event_name, func_name);
            return;
        }

        require([module_name], function (module) {
            if (msg) {
                require(["jquery", "jquery-growl"], function ($) {
                    $.growl.notice({message: msg});
                });
            }
            callback && callback(module);
        });

    });
}

/*
* patch for jquery growl functions.
* do not to show multiple growls with the same content.
* add more info to messages realted to websocket 'rate limit'
*/
require(['jquery', 'jquery-growl'], function($){
  ['error', 'notice', 'warning'].forEach(function(name){
      var perv = $.growl[name].bind($.growl);
      $.growl[name] = function(options){
        if(options.message.indexOf('rate limit') > -1) {
          options.message += ' Please try again after 1 minute.';
        }
        if(!options.title) options.title = ''; /* remove title */
        /* remove current growl with the same message */
        $('#growls .growl:contains("' + options.message + '")').remove();
        perv(options);
      }
  });
});
