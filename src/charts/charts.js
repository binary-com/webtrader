/**
 * Created by arnab on 2/11/15.
 */

define(["jquery","charts/chartingRequestMap", "websockets/binary_websockets", "websockets/ohlc_handler","currentPriceIndicator",
        "charts/indicators/highcharts_custom/indicators","moment", "lodash", 'text!charts/indicators/indicators.json',
        "highcharts-exporting", "common/util", 'paralleljs', 'jquery-growl'
        ],
  function ( $, chartingRequestMap, liveapi, ohlc_handler, currentPrice, indicators, moment, _, indicators_json ) {

    "use strict";

    $(function () {

        var indicator_ids = _(JSON.parse(indicators_json)).values().map('id').value();
        Highcharts.Chart.prototype.get_indicators = function() {
          var chart = this;
          var indicators = [];
          if(chart.series.length > 0){
              indicator_ids.forEach(function(id){
                chart.series[0][id] && indicators.push({id: id, options: chart.series[0][id][0].options})
              });
          }
          return indicators;
        }

        Highcharts.Chart.prototype.set_indicators = function(indicators){
            var chart = this;
            if(chart.series[0]) {
              indicators.forEach(function(ind) {
                 chart.series[0].addIndicator(ind.id, ind.options);
              });
            }
        }

        Highcharts.setOptions({
            global: {
                useUTC: true
            },
            lang: { thousandsSep: ',' } /* format numbers with comma (instead of space) */
        });

    });

    indicators.initHighchartIndicators(chartingRequestMap.barsTable);

    function destroy(options) {
        var containerIDWithHash = options.containerIDWithHash,
            timePeriod = options.timePeriod,
            instrumentCode = options.instrumentCode;
        if (!timePeriod || !instrumentCode) return;

        //granularity will be 0 for tick timePeriod
        var key = chartingRequestMap.keyFor(instrumentCode, timePeriod);
        chartingRequestMap.unregister(key, containerIDWithHash);
    }

    function generate_csv(chart, data) {
        var filename = data.instrumentName + ' (' + data.timePeriod + ')' + '.csv';

        var lines = [], dataToBeProcessTolines = [];
        var flattenData = function(d) {
            var ret = null;
            if (_.isArray(d) && d.length > 3) {
                var time = d[0];
                ret = '"' + moment.utc(time).format('YYYY-MM-DD HH:mm') + '"' + ',' + d.slice(1, d.length).join(',');
            } //OHLC case
            else if (_.isNumber(d.high)) ret = '"' + moment.utc(d.time).format('YYYY-MM-DD HH:mm') + '"' + ',' + d.open + ',' + d.high + ',' + d.low + ',' + d.close;
            else if (_.isArray(d) && d.length > 1) ret = '"' + moment.utc(d[0]).format('YYYY-MM-DD HH:mm') + '"' + ',' + d[1]; //Tick chart case
            else if (_.isObject(d) && d.title && d.text) {
                if (d instanceof FractalUpdateObject) {
                    ret = '"' + moment.utc(d.x || d.time).format('YYYY-MM-DD HH:mm') + '"' + ',' + (d.isBull ? 'UP' : d.isBear ? 'DOWN' : ' ');
                } else ret = '"' + moment.utc(d.x || d.time).format('YYYY-MM-DD HH:mm') + '"' + ',' + (d.text);
            }
            else if (_.isNumber(d.y)) ret = '"' + moment.utc(d.x || d.time).format('YYYY-MM-DD HH:mm') + '"' + ',' + (d.y || d.close);
            else ret = d.toString(); //Unknown case
            return ret;
        };
        chart.series.forEach(function(series, index) {
            if (series.options.id === 'navigator') return true;
            var newDataLines = series.options.data.map(function(d) {  return flattenData(d);  }) || [];
            if (index == 0) {
                var ohlc = newDataLines[0].split(',').length > 2;
                if (ohlc) lines.push('Date,Open,High,Low,Close');
                else lines.push('Date,"' + series.options.name + '"');
                //newDataLines is incorrect - get it from lokijs
                var key = chartingRequestMap.keyFor(data.instrumentCode, data.timePeriod);
                var bars = chartingRequestMap.barsTable
                    .chain()
                    .find({ instrumentCdAndTp: key })
                    .simplesort('time', false)
                    .data();
                lines = lines.concat(bars.map(function (b) {
                    return ohlc ? ['"' + moment.utc(b.time).format('YYYY-MM-DD HH:mm') + '"', b.open, b.high, b.low, b.close].join(',') : ['"' + moment.utc(b.time).format('YYYY-MM-DD HH:mm') + '"', b.close].join(',');
                }));
            }
            else {
                lines[0] += ',"' + series.options.name + '"'; //Add header
                dataToBeProcessTolines.push(newDataLines);
            }
        });

        $.growl.notice({ message : 'Downloading CSV' });
        //merge here
        new Parallel([lines, dataToBeProcessTolines])
            .spawn(function(data) {
                var l = data[0];
                var d = data[1];
                l = l.map(function(line, index) {

                    d.forEach(function(dd) {
                        var added = false;
                        dd.forEach(function(nDl) {
                            if (nDl) {
                                var temp = nDl.split(',');
                                if (line.split(',')[0] === temp[0]) {
                                    line += ',' + temp.slice(1, temp.length).join(',');
                                    added = true;
                                    return false;
                                }
                            }
                        });
                        if (line.indexOf('Date') == -1 && !added) line += ','; //Add a gap since we did not add a value
                    });

                    return line;
                });
                return l;
            })
            .then(function (data) {
                var csv = data.join('\n'); //(is_tick ? 'Date,Tick\n' : 'Date,Open,High,Low,Close\n') + lines.join('\n');
                var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                if (navigator.msSaveBlob) { // IE 10+
                    navigator.msSaveBlob(blob, filename);
                }
                else {
                    var link = document.createElement("a");
                    if (link.download !== undefined) {  /* Evergreen Browsers :) */
                        var url = URL.createObjectURL(blob);
                        link.setAttribute("href", url);
                        link.setAttribute("download", filename);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                }
            }, function(error) {
                $.growl.error({ message : 'Error downloading CSV' });
                console.error(error);
            });

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
            var indicators = [];

            if ($(containerIDWithHash).highcharts()) {
                //Just making sure that everything has been cleared out before starting a new thread
                var key = chartingRequestMap.keyFor(options.instrumentCode, options.timePeriod);
                chartingRequestMap.removeChart(key, containerIDWithHash);
                var chart = $(containerIDWithHash).highcharts();
                indicators = chart.get_indicators();
                chart.destroy();
            }

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
                                }).then(function() {
                                  var chart = $(containerIDWithHash).highcharts();
                                  chart.set_indicators(indicators); // put back removed indicators
                                });
                            })
                            if ($.isFunction(onload)) {
                                onload();
                            }

                            this.credits.element.onclick = function() {
                                window.open(
                                    'http://www.binary.com',
                                    '_blank'
                                );
                            }

                        }
                    },
                    spacingLeft: 0,
                    marginLeft: 45,  /* disable the auto size labels so the Y axes become aligned */
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
                                    //this.isDirty = true;
                                    //this.isDirtyData = true;

                                    //Add current price indicator
                                    //If we already added currentPriceLine for this series, ignore it
                                    console.log(this.options.id, this.yAxis.plotLinesAndBands);
                                    this.removeCurrentPrice();
                                    this.addCurrentPrice();
                                }

                                this.chart.hideLoading();
                                //this.chart.redraw();
                            }
                        }
                    }
                },

                title: {
                    //Show name on chart if it is accessed with affiliates = true parameter. In normal webtrader mode, we dont need this title because the dialog will have one
                    text: getParameterByName("affiliates") === 'true' ? options.instrumentName + " (" + options.timePeriod + ")" : "" //name to display
                },

                credits: {
                    href: 'http://www.binary.com',
                    text: 'Binary.com',

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
                    },
                    ordinal : false
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
                        },
                        align:'center'
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
                    enabled: true,
                    //Explicity mentioning what buttons to show otherwise this chart will
                    //also show Download CSV and Download XLS options. We do not want to
                    //show those options because highchart's implementation do not download
                    //all data from the chart. It only downloads the visible part of the chart.
                    //We have implemented Charts -> Download as CSV to download all data from
                    //chart
                    buttons: {
                        contextButton: {
                            menuItems: [{
                                text: 'Download PNG',
                                onclick: function () {
                                    this.exportChartLocal();
                                }
                            }, {
                                text: 'Download SVG',
                                onclick: function () {
                                    this.exportChartLocal({
                                        type: 'image/svg+xml'
                                    });
                                },
                                separator: false
                            }, {
                                text: 'Download CSV',
                                onclick: function () {
                                    generate_csv($(containerIDWithHash).highcharts(), $(containerIDWithHash).data());
                                },
                                separator: false
                            }]
                        }
                    },
                    // Naming the File
                    filename:options.instrumentName.split(' ').join('_')+"("+options.timePeriod+")"
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
                var indicators = chart.get_indicators();
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
                    if (series.options.isInstrument || series.options.onChartIndicator) {
                        series.update({
                            compare: 'percent'
                        });
                    }
                }

                liveapi.execute(function(){
                    ohlc_handler.retrieveChartDataAndRender({
                        timePeriod : mainSeries_timePeriod,
                        instrumentCode : overlayInsCode,
                        containerIDWithHash : containerIDWithHash,
                        type : mainSeries_type,
                        instrumentName : overlayInsName,
                        series_compare : 'percent',
                        delayAmount : delayAmount
                    }).then(function() {
                        chart.set_indicators(indicators);
                    });
                });
            }
        }

    }

});
