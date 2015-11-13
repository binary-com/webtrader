/**
 * Created by arnab on 2/11/15.
 */

requirejs.config({
    baseUrl: ".",
    paths: {
        'jquery': "lib/jquery/dist/jquery.min",
        'jquery-ui': "lib/jquery-ui/jquery-ui.min",
        'highstock': "lib/highstock/highstock",
        'highcharts-exporting': 'lib/highstock/modules/exporting',
        'highcharts-theme': 'lib/highstock/themes/sand-signika',
        'jquery.dialogextend' : "lib/binary-com-jquery-dialogextended/jquery.dialogextend.min",
        'jquery-growl': "lib/growl/javascripts/jquery.growl",
        'jquery-validation': "lib/jquery-validation/dist/jquery.validate.min",
        'modernizr': 'lib/modernizr/modernizr',
        'reconnecting-websocket': 'lib/reconnectingWebsocket/reconnecting-websocket.min',
        'lokijs': 'lib/lokijs/build/lokijs.min',
        'jquery-timer': "lib/jquery.timers/jquery.timers.min",
        'color-picker': "lib/colorpicker/jquery.colorpicker",
        'datatables': "lib/datatables/media/js/jquery.dataTables.min",
        //TODO find out whats the advantage of using datatables-jquery-ui
        'datatables-jquery-ui': 'lib/datatables/media/js/dataTables.jqueryui.min',
        'currentPriceIndicator': 'charts/indicators/highcharts_custom/currentprice',
        'indicator_base': 'charts/indicators/highcharts_custom/indicator_base',
        'es6-promise':'lib/es6-promise/promise.min',
        'js-cookie':'lib/js-cookie/src/js.cookie'
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
        "jquery-ui": {
            deps: ["jquery"]
        },
        "highstock": {
            deps: ["jquery"]
        },
        "highcharts-exporting": {
            deps: ["highstock"]
        },
        "highcharts-theme": {
            deps: ["highstock"]
        },
        "jquery-growl": {
            deps: ["jquery"]
        },
        "jquery-timer": {
            deps: ["jquery"]
        },
        "datatables": {
            deps: ["jquery-ui"]
        },
        "currentPriceIndicator": {
            deps: ["highstock"]
        }
    }
});

/* Initialize the websocket as soon as posssilbe */
require(['reconnecting-websocket', 'websockets/binary_websockets']);

require(["jquery", "modernizr", "common/util"], function( $ ) {

    "use strict";

    //TODO if SVG, websockets are not allowed, then redirect to unsupported_browsers.html
    if (!Modernizr.svg) {
      window.location.href = 'unsupported_browsers.html';
      return;
    }

    /* Trigger *Parallel* loading of big .js files,
       Suppose moudle X depends on lib A and module Y depends on lib B,
       When X loads it will trigger loading Y, which results in loading A and B Sequentially,
       
       We know that A and B should eventually be loaded, so trigger loading them ahead of time. */
    require(['jquery-ui', 'highstock', 'lokijs']);


    /* main.css overrides some classes in jquery-ui.css, make sure to load it after jquery-ui.css file */
    require(['css!lib/jquery-ui/themes/smoothness/jquery-ui.min.css','css!main.css'])

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
            });
        });
    }


    if (getParameterByName("affiliates") == 'true')  //Our chart is accessed by other applications
        handle_affiliate_route();
    else //Our chart is accessed directly
        handle_normal_route();

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
                console.log(2);
                gtm.init();
            });
        }

    });

});
