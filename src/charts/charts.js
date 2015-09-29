/**
 * Created by arnab on 2/11/15.
 */

define(["jquery", "websockets/eventSourceHandler", "common/util", "highstock", "highcharts-exporting"],
  function ( $, requireJSESHInstance ) {

    "use strict";

    $(function () {

        Highcharts.setOptions({
            global: {
                useUTC: true
            }
        });

    });

    return {

        /**
         * This method is the core and the starting point of highstock charts drawing
         * @param containerIDWithHash
         * @param instrumentCode
         * @param instrumentName
         * @param timeperiod
         * @param type
         */
        drawChart: function (containerIDWithHash, instrumentCode, instrumentName, timeperiod, type, series_compare) {

            if ($(containerIDWithHash).highcharts()) {
                //Just making sure that everything has been cleared out before starting a new thread
                this.destroy(containerIDWithHash, timeperiod, instrumentCode);
                $(containerIDWithHash).highcharts().destroy();
            }

            //Save some data in DOM
            $(containerIDWithHash).data({
                instrumentCode : instrumentCode,
                instrumentName : instrumentName,
                timeperiod : timeperiod,
                type : type
            });

            // Create the chart
            $(containerIDWithHash).highcharts('StockChart', {

                chart: {
                    events: {
                        load: function () {
                            this.showLoading();
                            console.log('Calling render chart for the first time for the instrument : ', instrumentCode);
                            requireJSESHInstance.retrieveChartDataAndRender( containerIDWithHash, instrumentCode, instrumentName, timeperiod, type, series_compare );
                        }
                    }
                    //,plotBackgroundImage: 'images/binary-watermark-logo.svg'
                },

                //This will be updated when 'Settings' button is implemented
                plotOptions: {
                    candlestick: {
                        lineColor: 'black',
                        color: 'red',
                        upColor: 'green',
                        upLineColor: 'black',
                        shadow: true
                    }
                },

                title: {
                    text: instrumentName + " (" + timeperiod + ")"//name to display
                },

                credits: {
                    href: 'http://www.binary.com',
                    text: 'Binary.com'
                },

                xAxis: {
                    events: {
                        afterSetExtremes: function () {
                            /*console.log('This method is called every time the zoom control is changed. TODO.' +
                             'In future, I want to get more data from server if users is dragging the zoom control more.' +
                             'This will help to load data on chart forever! We can warn users if they are trying to load' +
                             'too much data!');*/
                        }
                    }
                },

                yAxis: [{
                    opposite: false,
                    labels: {
                        formatter: function () {
                            if ($(containerIDWithHash).data("overlayIndicator"))
                            {
                                return (this.value > 0 ? ' + ' : '') + this.value + '%';
                            }
                            else
                            {
                                return this.value;
                            }
                        }
                    }
                }],

                rangeSelector: {
                    enabled: false
                },

                tooltip: {
                    crosshairs: [{
                        width: 2,
                        color: 'red',
                        dashStyle: 'dash'
                    }, {
                        width: 2,
                        color: 'red',
                        dashStyle: 'dash'
                    }],
                    enabled: true,
                    enabledIndicators: true
                },

                exporting: {
                    enabled: false //TODO work on this later
                }

            });


        },

        destroy : function( containerIDWithHash, timeperiod, instrumentCode ) {
            requireJSESHInstance.close( containerIDWithHash, timeperiod, instrumentCode );
        },

        triggerReflow : function( containerIDWithHash ) {
            if ($(containerIDWithHash).highcharts())
            {
                $(containerIDWithHash).highcharts().reflow();
            }
        },

        refresh : function ( containerIDWithHash ) {
            //Get all series details from this chart
            var chart = $(containerIDWithHash).highcharts();
            var marketData_displayValue = [], series_compare = undefined;
            $(chart.series).each(function (index, series) {
                if ($(series).data('isInstrument')) {
                    marketData_displayValue.push(series.name);
                    series_compare = series.options.compare;
                }
            });

            this.drawChart( containerIDWithHash, $(containerIDWithHash).data("instrumentCode"),
                $(containerIDWithHash).data("instrumentName"),
                $(containerIDWithHash).data("timeperiod"),
                $(containerIDWithHash).data("type"),
                series_compare
            );

            //Trigger overlay
            var chartObj = this;
            require(['instruments/instruments'], function (ins) {
                $(marketData_displayValue).each(function (index, value) {
                    //$(document).oneTime(1000, null, function () {
                        var marketDataObj = ins.getSpecificMarketData(value);
                        if (marketDataObj.symbol != undefined
                            && $.trim(marketDataObj.symbol) != $(containerIDWithHash).data("instrumentCode"))
                        {
                            chartObj.overlay( containerIDWithHash, marketDataObj.symbol, value);
                        }
                    //});
                });
            });
        },

        addIndicator : function ( containerIDWithHash, options ) {
            if($(containerIDWithHash).highcharts())
            {
                var chart = $(containerIDWithHash).highcharts();
                var series = chart.series[0];
                if (series) {
                    chart.addIndicator($.extend({
                                id: series.options.id
                            }, options));
                }
            }
        },

        /**
         * Function to overlay instrument on base chart
         * @param containerIDWithHash
         * @param overlayInsCode
         * @param overlayInsName
         */
        overlay : function( containerIDWithHash, overlayInsCode, overlayInsName ) {
            if($(containerIDWithHash).highcharts()) {
                var chart = $(containerIDWithHash).highcharts();
                //var mainSeries_instCode     = $(containerIDWithHash).data("instrumentCode");
                //var mainSeries_instName     = $(containerIDWithHash).data("instrumentName");
                /*
                    We have to first set the data to NULL and then recaculate the data and set it back
                    This is needed, else highstocks throws error
                 */
                var mainSeries_timeperiod   = $(containerIDWithHash).data("timeperiod");
                var mainSeries_type         = $(containerIDWithHash).data("type");
                chart.showLoading();
                for (var index = 0; index < chart.series.length; index++) {
                    //console.log('Instrument name : ' + chart.series[index].name);
                    var series = chart.series[index];
                    if ($(series).data('isInstrument')) {
                        var data = series.options.data;
                        series.setData([]);
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].x && data[i].y) {
                                data[i] = [data[i].x, data[i].y];
                            }
                        }
                        series.update({
                            compare: 'percent'
                        });
                        series.setData(data);
                        //Since we manipulated the complete dataset, we have to set the isInstrument variable again
                        $(series).data('isInstrument', true);
                    }
                    else if ($(series).data('onChartIndicator')) {
                        series.update({
                            compare: 'percent'
                        });
                    }
                }

            requireJSESHInstance.retrieveChartDataAndRender( containerIDWithHash, overlayInsCode, overlayInsName, mainSeries_timeperiod, mainSeries_type, 'percent' );

            }
        },

        passwordForm: function (title) {
            var form = document.createElement("form");
            form.setAttribute('id', 'form');
            var div = document.createElement("div");
            div.className = "leftDiv";
            var div1 = document.createElement("div");
            div1.className = "rightDiv";

            var currPassword = document.createTextNode("Current Password: ");
            div.appendChild(currPassword);
            div.appendChild(document.createElement("br"));
            var newPassword = document.createTextNode("New Password: ");
            div.appendChild(newPassword);
            div.appendChild(document.createElement("br"));
            var verPassword = document.createTextNode("Verify New Password: ");
            div.appendChild(verPassword);
            form.appendChild(div);

            var input = document.createElement("input");
            input.setAttribute('type',"password");
            input.setAttribute('name',"Current Password");
            div1.appendChild(input);

            div1.appendChild(document.createElement("br"));

            var input = document.createElement("input");
            input.setAttribute('type',"password");
            input.setAttribute('name',"New Password");
            div1.appendChild(input);

            div1.appendChild(document.createElement("br"));

            var input = document.createElement("input");
            input.setAttribute('type',"password");
            input.setAttribute('name',"Verify New Password");
            div1.appendChild(input);

            var submit = document.createElement("button");
            submit.setAttribute('type', 'submit');
            submit.setAttribute('id', 'submitPassword');
            submit.innerHTML= 'Change Password';

            form.appendChild(div1);
            form.appendChild(submit);
            $(title).append(form);
        }

    }

});
