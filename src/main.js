/**
 * Created by arnab on 2/11/15.
 */

requirejs.config({
    baseUrl: ".",
    paths: {
        'jquery': "//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min",
        'highstock': "//code.highcharts.com/stock/highstock",
        'highcharts-exporting': '//code.highcharts.com/stock/modules/exporting',
        'jquery-ui': "//ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min",
        'jquery-growl': "lib/jquery/jquery-growl/jquery.growl",
        'highcharts-theme': 'lib/highcharts/themes/sand-signika',
        'jquery-timer': "lib/jquery/jquery.timers",
        'datatables': "//cdn.datatables.net/1.10.5/js/jquery.dataTables.min",
        'color-picker': "lib/jquery/jquery-ui/colorpicker/jquery.colorpicker",
        'currentPriceIndicator': 'charts/indicators/highcharts_custom/currentprice',
        'modernizr': '//cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min',
        'reconnecting-websocket': '//cdnjs.cloudflare.com/ajax/libs/reconnecting-websocket/1.0.0/reconnecting-websocket.min',
        'lokijs': 'lib/lokijs.min'
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

require(["jquery", "jquery-ui", "modernizr", "common/loadCSS", "common/util"], function( $ ) {

    "use strict";

    //TODO if SVG, websockets are not allowed, then redirect to unsupported_browsers.html
    if (!Modernizr.svg) {
      window.location.href = 'unsupported_browsers.html';
      return;
    }

    resizeBackgroundWatermark();
    //Load Jquery UI CSS
    loadCSS("//ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/themes/smoothness/jquery-ui.css");

    //Load our main CSS
    loadCSS("main.css");
    loadCSS("lib/hamburger.css");

    function resizeBackgroundWatermark() {
      $(".binary-watermark-logo").height($(window).height() - 20)
                                 .width($(window).width() - 10);
    };

    function resetTopMenu() {
      var show = true;
      if(isSmallView()) {
        show = false;
      }
      $('.topContainer .topMenu button' ).each(function() {
        //This cloning step is required for proper functioning of clicks
        var ul = $(this).find("ul:first").clone(true);
        $(this).find("ul:first").remove();
        //When we set the text, Jquery UI is removing any child of this button. We have to restore this
        $(this).button("option", "text", show).button("widget").append(ul);
      });
    };

    //All dependencies loaded
    $(document).ready(function () {

        $(".mainContainer").load("mainContent.html", function() {

            $('.topContainer .topMenu')
                    .find("button" ).button()

            $(window).resize(function() {
              resetTopMenu();
            });
            resetTopMenu();

            //Trigger async loading of instruments and refresh menu
            require(["instruments/instruments"], function(instrumentsMod) {

                //Just an info
                require(["jquery", "jquery-growl"], function($) {
                    $.growl.notice({ message: "Loading chart menu!" });
                });

                instrumentsMod.init( $(".mainContainer .instruments").closest('div') );
            });

            //Trigger async loading of window sub-menu
            require(["windows/windows"], function( windows ) {
                windows.init($('.topContainer .windows').closest('div'));
            });

            require(["reports/reports"], function( reports ) {
                reports.init($('.topContainer .reports').closest('div'));
            });

            require(["asset/asset"], function( asset ) {
                asset.init($('.topContainer .asset').closest('div'));
            });

            require(["settings/settings"], function( settings ) {
                settings.init($('.topContainer .settings').closest('div'));
            });

        });

        //Now load all other CSS asynchronously
        loadCSS('lib/jquery/jquery-growl/jquery.growl.css');
        loadCSS('charts/charts.css');

    });

});
