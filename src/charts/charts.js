/**
 * Created by arnab on 2/11/15.
 */

define(["jquery","charts/chartingRequestMap", "websockets/binary_websockets", "websockets/ohlc_handler","currentPriceIndicator", "common/util", "highstock", "highcharts-exporting"],
  function ( $,chartingRequestMap, liveapi, ohlc_handler,currentPrice ) {

    "use strict";

    $(function () {

        Highcharts.setOptions({
            global: {
                useUTC: true
            }
        });

    });

    function destroy(containerIDWithHash, timePeriod, instrumentCode) {
        if (!timePeriod || !instrumentCode) return;

        //granularity will be 0 for tick timePeriod
        var granularity = convertToTimeperiodObject(timePeriod).timeInSeconds();
        var key = (instrumentCode + granularity).toUpperCase();
        if (chartingRequestMap[key]) {
            for (var index in chartingRequestMap[key].chartIDs) {
                var chartID = chartingRequestMap[key].chartIDs[index];
                if (chartID.containerIDWithHash == containerIDWithHash) {
                    chartingRequestMap[key].chartIDs.splice(index, 1);
                    break;
                }
            }
            if ($.isEmptyObject(chartingRequestMap[key].chartIDs)) {
                var requestObject = {
                    "ticks_history": instrumentCode,
                    "granularity" : granularity,
                    "end": 'latest',
                    "count": 1,
                    "subscribe": 0
                };
                liveapi.send(requestObject);

                if (chartingRequestMap[key].timerHandler) {
                    clearInterval(chartingRequestMap[key].timerHandler);
                }
                delete chartingRequestMap[key];
            }
        }
    }

    return {

        /**
         * This method is the core and the starting point of highstock charts drawing
         * @param containerIDWithHash
         * @param instrumentCode
         * @param instrumentName
         * @param timePeriod
         * @param type
         * @param onload // optional onload callback
         */
        drawChart: function (containerIDWithHash, options, onload) {

            var referenceToChartsJSObject = this;

            if ($(containerIDWithHash).highcharts()) {
                //Just making sure that everything has been cleared out before starting a new thread
                this.destroy(containerIDWithHash, options.timePeriod, options.instrumentCode);
                $(containerIDWithHash).highcharts().destroy();
            }

            console.log('Delay amount : ', options.delayAmount);
            //Save some data in DOM
            $(containerIDWithHash).data({
                instrumentCode : options.instrumentCode,
                instrumentName : options.instrumentName,
                timePeriod : options.timePeriod,
                type : options.type,
                delayAmount : options.delayAmount
            });

            // Create the chart
            $(containerIDWithHash).highcharts('StockChart', {

                chart: {
                    events: {
                        load: function () {
                            this.showLoading();
                            console.log('Calling render chart for the first time for the instrument : ', options.instrumentCode);
                            currentPrice.init();
                            liveapi.execute(function () {
                                ohlc_handler.retrieveChartDataAndRender({
                                    timePeriod : options.timePeriod,
                                    instrumentCode : options.instrumentCode,
                                    containerIDWithHash : containerIDWithHash,
                                    type : options.type,
                                    instrumentName : options.instrumentName,
                                    series_compare : options.series_compare,
                                    delayAmount : options.delayAmount
                                });
                            });
                            if ($.isFunction(onload)) {
                                onload();
                            }
                        }
                    },
                    spacingLeft: 0,
                    marginLeft: 40,  /* disable the auto size labels so the Y axes become aligned */
                    //,plotBackgroundImage: 'images/binary-watermark-logo.svg'
                },

                navigator: {
                    enabled: true,
                    series: {
                        id: 'navigator'
                    }
                },

                //This will be updated when 'Settings' button is implemented
                plotOptions: {
                    candlestick: {
                        lineColor: 'black',
                        color: 'red',
                        upColor: 'green',
                        upLineColor: 'black',
                        shadow: true
                    },
                    series: {
                        events: {
                            afterAnimate: function () {
                                if (this.options.isInstrument && this.options.id !== "navigator") {
                                    console.log('Series finished rendering!', this.options);
                                    //this.isDirty = true;
                                    //this.isDirtyData = true;

                                    //Add current price indicator
                                    this.addCurrentPrice();

                                    var series = this;
                                    /**
                                     * Add URL parameter based markers on chart
                                     */
                                    require(['charts/draw/highcharts_custom/horizontal_line', 'charts/draw/highcharts_custom/vertical_line'], function(horizontal_line, vertical_line) {

                                        horizontal_line.init();
                                        vertical_line.init();

                                        var startTime = parseInt(getParameterByName('startTime'));
                                        var endTime = parseInt(getParameterByName('endTime'));
                                        var entrySpotTime = parseInt(getParameterByName('entrySpotTime'));
                                        var barrierPrice = parseFloat(getParameterByName('barrierPrice'));
                                        if (startTime > 0) {
                                            //Draw vertical line
                                            series.addVerticalLine({
                                                value : startTime * 1000, //starTime is in millis
                                                name : 'Start Time'
                                            });
                                        }
                                        if (endTime > 0) {
                                            //Draw vertical line
                                            series.addVerticalLine({
                                                value :endTime * 1000, //starTime is in millis
                                                name : 'End Time'
                                            });
                                            //Start a timer which will stop chart feed
                                            var interval = setInterval(function(){
                                                if (Date.now() > ((endTime + 1) * 1000)) { //Keep rendering atleast 1 second after the end time
                                                    var ourData = $(series.chart.options.chart.renderTo).data();
                                                    console.log('Stopping feed based off timer : ', containerIDWithHash, ourData.timePeriod, ourData.instrumentCode);
                                                    referenceToChartsJSObject.destroy(containerIDWithHash, ourData.timePeriod, ourData.instrumentCode);
                                                    clearInterval(interval);
                                                }
                                            }, 500);
                                        }
                                        if (entrySpotTime > 0) {
                                            //Draw vertical line
                                            series.addVerticalLine({
                                                value : entrySpotTime * 1000, //starTime is in millis
                                                name : 'Entry Spot'
                                            });
                                        }
                                        if (barrierPrice) {
                                            //Draw horizontal line
                                            series.addHorizontalLine({
                                                value : barrierPrice,
                                                name : 'Barrier'
                                            });
                                        }
                                    });

                                }

                                this.chart.hideLoading();
                                //this.chart.redraw();
                            }
                        }
                    }
                },

                title: {
                    text: getParameterByName("affiliates") === 'true' ? options.instrumentName + " (" + options.timePeriod + ")" : "" //name to display
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
                    },
                    labels: {
                        formatter: function(){
                            var str = this.axis.defaultLabelFormatter.call(this);
                            return str.replace('.','');
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

        destroy : destroy,

        triggerReflow : function( containerIDWithHash ) {
            if ($(containerIDWithHash).highcharts())
            {
                $(containerIDWithHash).highcharts().reflow();
            }
        },

        refresh : function ( containerIDWithHash ) {
            //Get all series details from this chart
            var chart = $(containerIDWithHash).highcharts();
            var loadedMarketData = [], series_compare = undefined;
            $(chart.series).each(function (index, series) {
                console.log('Refreshing : ', series.options.isInstrument, series.options.name);
                if (series.options.isInstrument) {
                    loadedMarketData.push(series.name);
                    //There could be one valid series_compare value per chart
                    series_compare = series.options.compare;
                }
            });

            this.drawChart( containerIDWithHash, {
                instrumentCode : $(containerIDWithHash).data("instrumentCode"),
                instrumentName : $(containerIDWithHash).data("instrumentName"),
                timePeriod : $(containerIDWithHash).data("timePeriod"),
                type : $(containerIDWithHash).data("type"),
                series_compare : series_compare,
                delayAmount : $(containerIDWithHash).data("delayAmount")
            });

            //Trigger overlay
            var chartObj = this;
            require(['instruments/instruments'], function (ins) {
                loadedMarketData.forEach(function (value) {
                    var marketDataObj = ins.getSpecificMarketData(value);
                    if (marketDataObj.symbol != undefined && $.trim(marketDataObj.symbol) != $(containerIDWithHash).data("instrumentCode"))
                    {
                        chartObj.overlay( containerIDWithHash, marketDataObj.symbol, value, marketDataObj.delay_amount);
                    }
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
        overlay : function( containerIDWithHash, overlayInsCode, overlayInsName, delayAmount ) {
            if($(containerIDWithHash).highcharts()) {
                var chart = $(containerIDWithHash).highcharts();
                //var mainSeries_instCode     = $(containerIDWithHash).data("instrumentCode");
                //var mainSeries_instName     = $(containerIDWithHash).data("instrumentName");
                /*
                    We have to first set the data to NULL and then recaculate the data and set it back
                    This is needed, else highstocks throws error
                 */
                var mainSeries_timePeriod   = $(containerIDWithHash).data("timePeriod");
                var mainSeries_type         = $(containerIDWithHash).data("type");
                chart.showLoading();
                for (var index = 0; index < chart.series.length; index++) {
                    //console.log('Instrument name : ' + chart.series[index].name);
                    var series = chart.series[index];
                    if (series.options.isInstrument) {
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
                        series.options.isInstrument = true;
                    }
                    else if ($(series).data('onChartIndicator')) {
                        series.update({
                            compare: 'percent'
                        });
                    }
                }

                currentPrice.init();
                liveapi.execute(function(){
                    ohlc_handler.retrieveChartDataAndRender({
                        timePeriod : mainSeries_timePeriod,
                        instrumentCode : overlayInsCode,
                        containerIDWithHash : containerIDWithHash,
                        type : mainSeries_type,
                        instrumentName : overlayInsName,
                        series_compare : 'percent',
                        delayAmount : delayAmount
                    });
                });
            }
        }

    }

});
