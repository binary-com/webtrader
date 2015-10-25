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
        'js-cookie':'lib/js-cookie/src/js.cookie',
        'loadCSS': 'lib/loadcss/loadCSS'
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

    // adds onload support for asynchronous stylesheets loaded with loadCSS.
    function onloadCSS( ss, callback ) {
        ss.onload = function() {
            ss.onload = null;
            if( callback ) {
                callback.call( ss );
            }
        };

        // This code is for browsers that don’t support onload, any browser that
        // supports onload should use that instead.
        // No support for onload:
        //  * Android 4.3 (Samsung Galaxy S4, Browserstack)
        //  * Android 4.2 Browser (Samsung Galaxy SIII Mini GT-I8200L)
        //  * Android 2.3 (Pantech Burst P9070)

        // Weak inference targets Android < 4.4
        if( "isApplicationInstalled" in navigator && "onloadcssdefined" in ss ) {
            ss.onloadcssdefined( callback );
        }
    }

    // load jq-ui & growl stylesheets.
    loadCSS("lib/jquery-ui/themes/smoothness/jquery-ui.min.css");
    loadCSS('lib/growl/stylesheets/jquery.growl.css');
    // load main stylesheet.
    loadCSS("main.css");

    var navigationStylesheet = loadCSS("navigation/navigation.css");
    onloadCSS(navigationStylesheet, function () {
        //All dependencies loaded
        $(window).load(function () {
            /* example: load_ondemand(li,'click','tradingtimes/tradingtimes',callback) */
            var load_ondemand = function (element, event_name,msg, module_name,callback) {
                element.one(event_name, function () {
                    require([module_name], function (module) {
                        // display a notification only
                        // if there's a message.
                        if(msg && msg.length) {
                            require(["jquery", "jquery-growl"], function($) {
                                $.growl.notice({ message: msg });
                            });
                        }
                        
                        callback && callback(module);
                    });
                });
            }

            /* this callback is executed right after the navigation module
               has been loaded & initialized. register your menu click handlers here */
            var registerMenusCallback = function ($navMenu) {
                //Register async loading of tradingTimes sub-menu
                load_ondemand(
                    $navMenu.find("a.tradingTimes"),
                    'click','Loading Trading Times ...',
                    'tradingtimes/tradingTimes',
                    function (tradingTimes) {
                        var elem = $navMenu.find("a.tradingTimes");
                        tradingTimes.init(elem);
                        elem.click();
                    }
                );

                //Register async loading of window asset-index
                load_ondemand(
                    $navMenu.find("a.assetIndex"),
                    'click',
                    'loading Asset Index ...',
                    'assetindex/assetIndex',
                    function (assetIndex) {
                        var elem = $navMenu.find("a.assetIndex");
                        assetIndex.init(elem);
                        elem.click(); 
                    }
                );

                // register async loading of change password dialog.
                load_ondemand(
                    $navMenu.find("a.password"),
                    'click', '',
                    'password/password',
                    function (password) {
                        var $elem = $navMenu.find("a.password");
                        password.init($elem);
                        $elem.click();
                    }
                );
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

            //Now load all other CSS asynchronously
            loadCSS("lib/hamburger.css");
            loadCSS('charts/charts.css');
            loadCSS("lib/datatables/media/css/jquery.dataTables.min.css");
            loadCSS("lib/datatables/media/css/dataTables.jqueryui.min.css");
            loadCSS("lib/colorpicker/jquery.colorpicker.css");
        });
    });
});
