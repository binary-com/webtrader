/**
 * Created by arnab on 2/11/15.
 */

requirejs.config({
    baseUrl: ".",
    paths: {
        'jquery': "lib/jquery-legacy/dist/jquery.min",
        'jquery-ui': "lib/jqueryui/jquery-ui.min",
        'highstock': "lib/highstock/highstock",
        'highcharts-exporting': 'lib/highstock/modules/exporting',
        'highcharts-theme': 'lib/highstock/themes/sand-signika',
        'jquery.dialogextend' : "lib/jquery-dialogextend/build/jquery.dialogextend.min",
        'jquery-growl': "lib/growl/javascripts/jquery.growl",
        'modernizr': 'lib/modernizr/dist/modernizr-build',
        'reconnecting-websocket': 'lib/reconnectingWebsocket/reconnecting-websocket.min',
        'lokijs': 'lib/lokijs/build/lokijs.min',
        'jquery-timer': "lib/jquery.timers/jquery.timers",
        'color-picker': "lib/colorpicker/jquery.colorpicker",
        'datatables': "lib/datatables/media/js/jquery.dataTables.min",
        'currentPriceIndicator': 'charts/indicators/highcharts_custom/currentprice',
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

require(["jquery", "jquery-ui", "modernizr", "lib/loadCSS", "common/util"], function( $ ) {

    "use strict";

    //TODO if SVG, websockets are not allowed, then redirect to unsupported_browsers.html
    if (!Modernizr.svg) {
      window.location.href = 'unsupported_browsers.html';
      return;
    }

    //Load Jquery UI CSS
    loadCSS("lib/jquery-ui/themes/smoothness/jquery-ui.min.css");

    resizeBackgroundWatermark();

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
                    .filter('.windows').button({
                      icons: {
                        primary: "windows-icon",
                      }
                    }).end()
                    .filter('.instruments').button({
                      icons: {
                        primary: "instruments-icon",
                      },
                      disabled: true
                    }).end()
                    .filter(".workspace").button({
                      icons: {
                        primary: "workspace-icon",
                      },
                      disabled: true
                    });

            $(window).resize(function() {
              resetTopMenu();
            });
            resetTopMenu();

            //Trigger async loading of instruments and refresh menu
            require(["instruments/instruments"], function(instrumentsMod) {

                //Just an info
                require(["jquery", "jquery-growl"], function($) {
                    $.growl.notice({ message: "Loading instruments menu!" });
                });

                instrumentsMod.init();
            });

            //Trigger async loading of window sub-menu
            require(["windows/windows"], function( windows ) {
                windows.init($('.topContainer .windows').closest('div'));
            });

            //Resize the background image
            $(window).resize(function() {
              resizeBackgroundWatermark();
            });

        });

        //Now load all other CSS asynchronously
        loadCSS('lib/growl/stylesheets/jquery.growl.css');
        loadCSS('charts/charts.css');

    });

});
