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
        'reconnecting-websocket': '//cdnjs.cloudflare.com/ajax/libs/reconnecting-websocket/1.0.0/reconnecting-websocket.min',
        'currentPriceIndicator': 'charts/indicators/highcharts_custom/currentprice',
        'modernizr': '//cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min'
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

    function resizeElement(selector) {
      $(selector).height($(window).height() - 10).width($(window).width() - 10);
    };


    //TODO if SVG, websockets are not allowed, then redirect to unsupported_browsers.html
    if (!Modernizr.svg) {
      window.location.href = 'unsupported_browsers.html';
      return;
    }

    resizeElement(".binary-watermark-logo");
    //Load Jquery UI CSS
    loadCSS("//ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/themes/smoothness/jquery-ui.css");

    //Load our main CSS
    loadCSS("main.css");
    loadCSS("lib/hamburger.css");

    function validateParameters(instrumentObject) {
      var instrumentCode_param = getParameterByName('instrument');
      var timePeriod_param = getParameterByName('timePeriod');

      if (!instrumentCode_param || !timePeriod_param) return false;

      var timePeriod_Obj = null;
      try {
        timePeriod_Obj = convertToTimeperiodObject(timePeriod_param);
      } catch(e) {}
      if (!timePeriod_Obj || ['t', 'm', 'h', 'd'].indexOf(timePeriod_Obj.suffix()) == -1) return false;
      if (timePeriod_Obj.suffix() == 't' && timePeriod_Obj.intValue() != 1) return false;

      var timePeriod_inMins = timePeriod_Obj.timeInSeconds() / 60;
      var feedDelay_inMins = instrumentObject.delay_amount;
      return timePeriod_inMins >= feedDelay_inMins;
    };

    //All dependencies loaded
    $(document).ready(function () {

        $(".mainContainer").load("mainContent.html", function() {

            $('.topContainer').hide().find("button" ).button();

            //Resize the background image
            $(window).resize(function() {
              resizeElement(".binary-watermark-logo");
            });

            //Trigger async loading of instruments and refresh menu
            require(["instruments/instruments"], function(instrumentsMod) {
                instrumentsMod.init( $(".mainContainer .instruments").closest('div') );
            });

            $.get("charts/chartWindow.html" , function( $html ) {

                var newTabId = "chart-dialog-1",
                    timePeriod = getParameterByName('timePeriod') || '1d',
                    type = timePeriod == '1t'? 'line' : 'candlestick';

                $html = $($html);
                $html.attr("id", newTabId)
                    .find('div.chartSubContainerHeader').attr('id', newTabId + "_header").end()
                    .find('div.chartSubContainer').attr('id', newTabId + "_chart").end()
                    ;

                require(["charts/chartOptions"], function(chartOptions) {
                    chartOptions.init(newTabId, timePeriod, type);
                });

                $.get("https://chart.binary.com/d/backend/markets.cgi", function (_instrumentJSON) {
                    if (!$.isEmptyObject(_instrumentJSON)) {
                      var instrumentObject = getObjects(_instrumentJSON, 'symbol', getParameterByName('instrument'));
                      if (instrumentObject && instrumentObject.length > 0
                              && instrumentObject[0].symbol && instrumentObject[0].display_name) {

                                //Do validation of parameters here
                                if (validateParameters(instrumentObject[0])) {
                                  var instrumentCode = instrumentObject[0].symbol;
                                  var instrumentName = instrumentObject[0].display_name;
                                  require(["charts/charts"], function (charts) {
                                      charts.drawChart( "#" + newTabId + "_chart", instrumentCode, instrumentName, timePeriod, type );
                                  });
                                } else {
                                  require(["jquery", "jquery-growl"], function ($) {
                                      $.growl.error({message: "Invalid parameter(s)!"});
                                  });
                                  $html.find('div.chartSubContainerHeader').hide();
                                }

                      } else {
                        require(["jquery", "jquery-growl"], function ($) {
                            $.growl.error({message: "Instrument Code Unknown/Unavailable!"});
                        });
                        $html.find('div.chartSubContainerHeader').hide();
                      }
                    } else {

                    }
                }, 'json').error(function () {
                    require(["jquery", "jquery-growl"], function ($) {
                        $.growl.error({message: "Error getting market information!"});
                    });
                    $html.find('div.chartSubContainerHeader').hide();
                });

                $(".mainContainer").append($html);
                $('.binary-watermark-logo').hide();
                resizeElement('#' + newTabId);
                resizeElement('#' + newTabId + " .chartSubContainer");
                $(window).resize(function() {
                  resizeElement('#' + newTabId);
                  resizeElement('#' + newTabId + " .chartSubContainer");
                });

            });

        });

        //Now load all other CSS asynchronously
        loadCSS('lib/jquery/jquery-growl/jquery.growl.css');
        loadCSS('charts/charts.css');

    });

});
