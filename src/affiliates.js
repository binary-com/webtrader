requirejs.config({
    baseUrl: ".",
    paths: {
        'jquery': "//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min",
        'jquery-ui': "//ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min",
        'highstock': "//code.highcharts.com/stock/highstock",
        'highcharts-exporting': '//code.highcharts.com/stock/modules/exporting',
        'highcharts-theme': 'lib/highstock/themes/sand-signika',
        'jquery.dialogextend' : "lib/binary-com-jquery-dialogextended/jquery.dialogextend.min",
        'jquery-growl': "lib/growl/javascripts/jquery.growl",
        'modernizr': '//cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min',
        'reconnecting-websocket': '//cdnjs.cloudflare.com/ajax/libs/reconnecting-websocket/1.0.0/reconnecting-websocket.min',
        'lokijs': 'lib/lokijs/build/lokijs.min',
        'jquery-timer': "lib/jquery.timers/jquery.timers.min",
        'color-picker': "lib/colorpicker/jquery.colorpicker",
        'datatables': "//cdn.datatables.net/1.10.5/js/jquery.dataTables.min",
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

require(["jquery", "websockets/binary_websockets", "jquery-ui", "modernizr", "loadCSS", "common/util"], function($, liveapi) {
    "use strict";

    function resizeElement(selector) {
        $(selector).height($(window).height() - 10).width($(window).width() - 10);
    };

    //TODO if SVG, websockets are not allowed, then redirect to unsupported_browsers.html
    if (!Modernizr.svg) {
        window.location.href = 'unsupported_browsers.html';
        return;
    }

    //Load Jquery UI CSS
    loadCSS("//ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/themes/smoothness/jquery-ui.css");

    //Load our main CSS
    loadCSS("main.css");
    loadCSS("lib/hamburger.css");
    loadCSS("lib/growl/stylesheets/jquery.growl.css")

    function validateParameters(instrumentObject) {
        var instrumentCode_param = getParameterByName('instrument');
        var timePeriod_param = getParameterByName('timePeriod');
        if (!instrumentCode_param || !timePeriod_param) return false;

        var timePeriod_Obj = null;
        try {
            timePeriod_Obj = convertToTimeperiodObject(timePeriod_param);
        } catch (e) {}
        if (!timePeriod_Obj || ['t', 'm', 'h', 'd'].indexOf(timePeriod_Obj.suffix()) == -1) return false;
        if (timePeriod_Obj.suffix() == 't' && timePeriod_Obj.intValue() != 1) return false;

        var timePeriod_inMins = timePeriod_Obj.timeInSeconds() / 60;
        var feedDelay_inMins = instrumentObject.delay_amount;
        return timePeriod_inMins >= feedDelay_inMins;
    };

    //All dependencies loaded
    $(document).ready(function() {
        // get chart window html.
        $.get("charts/chartWindow.html", function(html) {
            var newTabId = "chart-dialog-1",
                timePeriod = getParameterByName('timePeriod') || '1d',
                type = timePeriod == '1t' ? 'line' : 'candlestick';

            var $html = $(html);
            $html.attr("id", newTabId)
                .find('div.chartSubContainerHeader').attr('id', newTabId + "_header").end()
                .find('div.chartSubContainer').attr('id', newTabId + "_chart").end();

            require(["charts/chartOptions"], function(chartOptions) {
                chartOptions.init(newTabId, timePeriod, type);
            });

            // load market information (instruments) from API.
            liveapi
              .cached.send({ trading_times: new Date().toISOString().slice(0, 10) })
              .then(function (_instrumentJSON) {
                if (!$.isEmptyObject(_instrumentJSON)) {
                    var instrumentCode = getParameterByName('instrument');
                    var instrumentObject = getObjects(_instrumentJSON, 'symbol', instrumentCode);
                    if (instrumentObject && instrumentObject.length > 0 && instrumentObject[0].symbol && instrumentObject[0].name) {
                        // validate the parameters here.
                        if (validateParameters(instrumentObject[0])) {
                            var instrumentCode = instrumentObject[0].symbol;
                            var instrumentName = instrumentObject[0].name;
                            require(["charts/charts"], function(charts) {
                                charts.drawChart("#" + newTabId + "_chart", instrumentCode, instrumentName, timePeriod, type);
                            });
                        } else {
                            require(["jquery", "jquery-growl"], function($) {
                                $.growl.error({
                                    message: "Invalid parameter(s)!"
                                });
                            });
                            $html.find('div.chartSubContainerHeader').hide();
                        }
                    } else {
                        require(["jquery", "jquery-growl"], function($) {
                            $.growl.error({
                                message: "Instrument Code Unknown/Unavailable!"
                            });
                        });
                        $html.find('div.chartSubContainerHeader').hide();
                    }
                }
              })
              .catch(function (e) {
                  require(["jquery", "jquery-growl"], function($) {
                      $.growl.error({
                          message: "Error getting market information!"
                      });
                  });
                  $html.find('div.chartSubContainerHeader').hide();
              });

            $(".mainContainer").append($html);
            resizeElement('#' + newTabId);
            resizeElement('#' + newTabId + " .chartSubContainer");
            $(window).resize(function() {
                resizeElement('#' + newTabId);
                resizeElement('#' + newTabId + " .chartSubContainer");
            });

        });

        //Now load all other CSS asynchronously
        loadCSS('charts/charts.css');
    });
});
