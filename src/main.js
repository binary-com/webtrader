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

    //Load Jquery UI CSS
    loadCSS("lib/jquery-ui/themes/smoothness/jquery-ui.min.css");

    //Load our main CSS
    loadCSS("main.css");
    loadCSS("lib/hamburger.css");

    //All dependencies loaded
    $(document).ready(function () {
        /* example: load_ondemand(li,'click','tradingtimes/tradingtimes',callback) */
        var load_ondemand = function (element, event_name,msg, module_name,callback) {
            element.one(event_name, function () {
                require([module_name], function (module) {
                    // display a notification only if a message exists
                    if (msg && msg.length) {
                        require(["jquery", "jquery-growl"], function($) {
                            $.growl.notice({ message: msg });
                        });
                    }
                    callback && callback(module);
                });
            });
        }

        /* this callback is executed after the menu has been
           loaded. register your menu click handlers here */
        var registerMenuHandlers = function ($navMenu) {
            // $navMenu: #nav-container #nav-menu

            // Register async loading of tradingTimes sub-menu
            var $tradingTimesMenu = $navMenu.find(".tradingTimes");
            load_ondemand($tradingTimesMenu, 'click', 'Loading Trading Times ...', 'tradingtimes/tradingTimes', function (tradingTimes) {
                tradingTimes.init($tradingTimesMenu);
            });
        }

        // Trigger async loading of navigation module
        require(['navigation/navigation'], function(navigation) {
            navigation.init(registerMenuHandlers);

            // Trigger async loading of instruments menu
            require(["instruments/instruments"], function(instrumentsMod) {
                require(["jquery", "jquery-growl"], function($) {
                    $.growl.notice({ message: "Loading chart menu!" });
                });

                instrumentsMod.init();
            });

            // Trigger async loading of window sub-menu
            require(["windows/windows"], function (windows) {
                var $windowsMenu = $("#nav-menu .windows");
                windows.init($windowsMenu);
            });
        });

        //Now load all other CSS asynchronously
        loadCSS('lib/growl/stylesheets/jquery.growl.css');
        loadCSS('charts/charts.css');
        loadCSS("lib/datatables/media/css/jquery.dataTables.min.css");
        loadCSS("lib/datatables/media/css/dataTables.jqueryui.min.css");
        loadCSS("lib/colorpicker/jquery.colorpicker.css");

        // the document's ready, hide the spinner.
        $(".sk-spinner-container").hide();
    });

});
