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
        'eventsource': 'lib/eventsource',
        'currentPriceIndicator': 'charts/indicators/highcharts_custom/currentprice'
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

require(["jquery", "jquery-ui", "common/loadCSS"], function( $ ) {

    "use strict";

    //Load Jquery UI CSS
    loadCSS("//ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/themes/smoothness/jquery-ui.css");

    //Load our main CSS
    loadCSS("main.css");
    loadCSS("lib/hamburger.css");

    //All dependencies loaded
    $(document).ready(function () {

        $(".mainContainer").load("mainContent.html", function() {

            $('.mainMenuHamburgerMenu').click(function (e) {
                $(this)
                    .toggleClass('active')
                    .next('ul:first').toggle();
                return false;
            });

            $( ".topContainer ul" ).menu();
            $(document).click(function (e) {
                //e.target.nodeName != 'LI' >>> Captures click on document
                if( e.target.nodeName != 'LI' || $(e.target).find('ul').length == 0 )
                {
                    $("ul.ui-menu").hide();
                    //We are hiding menu, so have to revert back the menus to normal state
                    $(".cmn-toggle-switch").removeClass("active");
                }
            });

            //Trigger async loading of instruments and refresh menu
            require(["instruments/instruments"], function(instrumentsMod) {

                //Just an info
                require(["jquery", "jquery-growl"], function($) {
                    $.growl.notice({ message: "Loading instruments menu!" });
                });

                instrumentsMod.init( $(".mainContainer").find('.instruments') );
            });

            //Trigger async loading of window sub-menu
            require(["windows/windows"], function( windows ) {
                windows.init($('.topContainer ul li.windows'));
            });

            $('.topContainer ul li.about').click(function () {

                require(["about/about"], function( about ) {
                    about.open();
                });

            });

        });

        //Now load all other CSS asynchronously
        loadCSS('lib/jquery/jquery-growl/jquery.growl.css');
        loadCSS('charts/charts.css');

    });

});
