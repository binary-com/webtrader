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
        'datatables-scroller' : "lib/datatables-scroller/js/dataTables.scroller",
        //TODO find out whats the advantage of using datatables-jquery-ui
        'datatables-jquery-ui': 'lib/datatables/media/js/dataTables.jqueryui.min',
        'currentPriceIndicator': 'charts/indicators/highcharts_custom/currentprice',
        'indicator_base': 'charts/indicators/highcharts_custom/indicator_base',
        'es6-promise':'lib/es6-promise/promise.min',
        'js-cookie':'lib/js-cookie/src/js.cookie',
        'loadCSS': 'lib/loadcss/loadCSS',
        'gtm': 'gtm/gtm'
    },
    "shim": {
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
        },
        "gtm": {
            deps: ['jquery']
        }
    }
});

require(["jquery", "jquery-ui", "modernizr", "loadCSS", "common/util"], function( $ ) {

    "use strict";

    //TODO if SVG, websockets are not allowed, then redirect to unsupported_browsers.html
    if (!Modernizr.svg) {
      window.location.href = 'unsupported_browsers.html';
      return;
    }

    // load jq-ui & growl stylesheets.
    loadCSS("lib/jquery-ui/themes/smoothness/jquery-ui.min.css");
    loadCSS('lib/growl/stylesheets/jquery.growl.css');
    // load main stylesheet.
    loadCSS("main.css");

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

            //Register async loading of window profit-table
            load_ondemand($navMenu.find("a.profitTable"), 'click', 'loading Profit Table ...', 'profittable/profitTable',
                function (profitTable) {
                    var elem = $navMenu.find("a.profitTable");
                    profitTable.init(elem);
                    elem.click(); 
                });
        }

        require(["navigation/navigation"], function (navigation) {
            navigation.init(registerMenusCallback);

            /* initialize the top menu because other dialogs
             * will assume an initialized top menu */
            $("#menu").menu();

            //Trigger async loading of instruments and refresh menu
            require(["instruments/instruments"], function(instrumentsMod) {
                    require(["jquery", "jquery-growl"], function($) {
                        $.growl.notice({ message: "Loading chart menu!" });
                    });

                    instrumentsMod.init();
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

    onloadCSS(loadCSS("navigation/navigation.css"), function () {
        //All dependencies loaded
        //TODO find out the consequence of not having the following line
        //This is causing very slow loading of charts, sometimes not loading at all
        //$(window).load(function () {

            // add GTM scripts if specified.
            //TODO
            // var loadGTM = getParameterByName("gtm") || true;
            // if(loadGTM == 'true') {
            //     require(['gtm'], function (gtm) {
            //         gtm.init();
            //     });
            // }

            var isAffiliate = getParameterByName("affiliates") || false;
            //Our chart is accessed by other applications
            if (isAffiliate == 'true') {
                handle_affiliate_route();
            }
            //Our chart is accessed directly
            else {
                handle_normal_route();
            }

            //Now load all other CSS asynchronously
            loadCSS("lib/hamburger.css");
            loadCSS('charts/charts.css');
            loadCSS("lib/datatables/media/css/jquery.dataTables.min.css");
            loadCSS("lib/datatables/media/css/dataTables.jqueryui.min.css");
            loadCSS("lib/colorpicker/jquery.colorpicker.css");

        //});

    });
});
