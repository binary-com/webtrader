/**
 * Created by arnab on 2/11/15.
 */

requirejs.config({
    baseUrl: ".",
    paths: {
        jquery: "jquery/jquery",
        highstock: "highcharts/highstock",
        'jquery-ui': "jquery/jquery-ui/jquery-ui.min"
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
        }
    }
});

require(["jquery",
            "windows/resizeHandler", "jquery-ui",
            "utils/loadCSS"], function($, resizeHandler) {

    "use strict";

    //Load Jquery UI CSS
    loadCSS("jquery/jquery-ui/jquery-ui.min.css");
    loadCSS("jquery/jquery-ui/jquery-ui.theme.min.css");
    loadCSS("jquery/jquery-ui/jquery-ui.structure.min.css");

    //Load our main CSS
    loadCSS("index.css");

    //All dependencies loaded
    $(document).ready(function () {

        $(".mainContainer").load("mainContent.html", function() {

            //Hide the loading image
            $(this).find("img").attr("src", "");

            $( "button" ).button();

            $( "#tabs" ).tabs({
                scrollable: true,
                changeOnScroll: false,
                closable: true,
                collapsible: true
            });


            resizeHandler.init();

            $("#instruments").click(function(e) {
                require(["instruments/instruments"], function(instrumentsMod) {
                    instrumentsMod.open();
                });
                e.preventDefault();
            });


            require(["charts/tabs"], function (tabs) {
                tabs.addNewTab('R_25', "Random 25", '1d');
            });

        });

    });

});
