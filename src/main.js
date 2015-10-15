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
        'binary-live-api': 'lib/binary-live-api/dist/binary-live-api',
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

        $(".mainContainer").load("mainContent.html", function() {

            //Trigger async loading of instruments and refresh menu
            require(["instruments/instruments"], function(instrumentsMod) {

                //Just an info
                require(["jquery", "jquery-growl"], function($) {
                    $.growl.notice({ message: "Loading chart menu!" });
                });

                instrumentsMod.init();
            });

            //Trigger async loading of window sub-menu
            require(["windows/windows"], function( windows ) {
                windows.init($('.topContainer .windows').closest('li'));
            });
        });

        //Now load all other CSS asynchronously
        loadCSS('lib/growl/stylesheets/jquery.growl.css');
        loadCSS('charts/charts.css');
        loadCSS("lib/datatables/media/css/jquery.dataTables.min.css");
        loadCSS("lib/datatables/media/css/dataTables.jqueryui.min.css");
        loadCSS("lib/colorpicker/jquery.colorpicker.css");

    });

});
