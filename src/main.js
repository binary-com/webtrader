/**
 * Created by arnab on 2/11/15.
 */

requirejs.config({
    baseUrl: ".",
    paths: {
        'jquery': "//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min",
        'highstock': "highcharts/highstock.src",
        'jquery-ui': "//ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min",
        'jquery-growl': "jquery/jquery-growl/jquery.growl",
        'sand-signika-theme': 'highcharts/themes/sand-signika',
        'jquery-timer': "jquery/timer/jquery.timers.min",
        'datatables': "jquery/jquery-ui/datatables/dataTables.jqueryui",
        'color-picker': "jquery/jquery-ui/colorpicker/jquery.colorpicker",
        modernizr: 'modernizr/modernizr.custom.53883'
    },
    "shim": {
        "jquery-ui": {
            deps: ["jquery"]
        },
        "highstock": {
            deps: ["jquery"]
        },
        "highcharts/exporting": {
            deps: ["highstock"]
        },
        "sand-signika-theme": {
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
        }
    }
});

require(["jquery", "jquery-ui", "common/loadCSS", "modernizr"], function( $ ) {

    "use strict";

    if (!Modernizr.eventsource)
    {
        $(".mainContainer").load("unsupported_browsers.html");
        return;
    }

    //Load Jquery UI CSS
    loadCSS("//ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/themes/smoothness/jquery-ui.css");

    //Load our main CSS
    loadCSS("main.css");

    //All dependencies loaded
    $(document).ready(function () {

        $(".mainContainer").load("mainContent.html", function() {

            $(this).find('img:first').hover(function() {
                $(this).toggleClass('ui-state-hover').toggleClass('ui-state-active');
            }, function () {
                $(this).toggleClass('ui-state-hover').toggleClass('ui-state-active');
            }).click(function (e) {
                $(this).next('ul:first').toggle();
                return false;
            });

            $( ".topContainer ul" ).menu();
            $(document).click(function (e) {
                //e.target.nodeName != 'LI' >>> Captures click on document
                if( e.target.nodeName != 'LI' || $(e.target).find('ul').length == 0 )
                {
                    $("ul.ui-menu").hide();
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
        loadCSS('jquery/jquery-growl/jquery.growl.css');
        loadCSS('charts/charts.css');

    });

});
