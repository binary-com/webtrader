/**
 * Created by arnab on 2/11/15.
 */
define(["jquery","charts/chartingRequestMap", "websockets/binary_websockets", "websockets/ohlc_handler","currentPriceIndicator",
        "charts/indicators/highcharts_custom/indicators","moment", "lodash", 'text!charts/indicators/indicators.json',
        "highcharts-exporting", "common/util", 'paralleljs', 'jquery-growl'
        ],
  function ( $, chartingRequestMap, liveapi, ohlc_handler, currentPrice, indicators, moment, _, indicators_json ) {

    "use strict";

    var indicator_values = _(JSON.parse(indicators_json)).values().value();
    Highcharts.Chart.prototype.get_indicators = function() {
      var chart = this;
      var indicators = [];
      if(chart.series.length > 0){
          indicator_values.forEach(function(ind){
            var id = ind.id;
            chart.series[0][id] && chart.series[0][id][0] && indicators.push({id: id, name: ind.long_display_name, options: chart.series[0][id][0].options})
          });
      }

      return indicators;
    }

    Highcharts.Chart.prototype.set_indicators = function(indicators){
        var chart = this;
        if(chart.series[0]) {
          indicators.forEach(function(ind) {
             require(["charts/indicators/" + ind.id + "/" + ind.id], function () {
               chart.series[0].addIndicator(ind.id, ind.options);
             });
          });
        }
    }

    Highcharts.Chart.prototype.get_indicator_series = function() {
      var chart = this;
      var series = [];
      if(chart.series.length > 0){
          indicator_values.forEach(function(ind){
            var id = ind.id;
            chart.series[0][id] && chart.series[0][id][0] && series.push({id: id, series: chart.series[0][id] })
          });
      }
      return series;
    }

    Highcharts.Chart.prototype.set_indicator_series = function(series) {
      var chart = this;
      if(chart.series.length == 0) { return ; }
      series.forEach(function(seri) {
        chart.series[0][seri.id] = seri.series;
      });
    }

    Highcharts.Chart.prototype.get_overlay_count =  function() {
        var overlayCount = 0;
        this.series.forEach(function(s, index){
            if(s.options.isInstrument && s.options.id.indexOf('navigator') == -1 && index != 0){
                overlayCount++;
            }
        });
        return overlayCount;
    }

    $(function () {

        Highcharts.setOptions({
            global: {
                useUTC: true,
                canvasToolsURL: "https://code.highcharts.com/modules/canvas-tools.js"
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

        $.growl.notice({ message : 'Downloading .csv'.i18n() });
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
                $.growl.error({ message : 'Error downloading .csv'.i18n() });
                console.error(error);
            });

    }

    var charts_functions = {

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
            var overlays = [];

            if ($(containerIDWithHash).highcharts()) {
                //Just making sure that everything has been cleared out before starting a new thread
                var key = chartingRequestMap.keyFor(options.instrumentCode, options.timePeriod);
                chartingRequestMap.removeChart(key, containerIDWithHash);
                var chart = $(containerIDWithHash).highcharts();
                indicators = chart.get_indicators();
                overlays = options.overlays;
                chart.destroy();
            }
            if(options.indicators) { /* this comes only from tracker.js & ChartTemplateManager.js */
              indicators = options.indicators;
              overlays = options.overlays;
              $(containerIDWithHash).data("overlayCount", overlays.length);
            }

            /* ingore overlays if chart type is candlestick or ohlc */
            if ((options.type === 'candlestick' || options.type === 'ohlc') && overlays.length > 0) {
              /* we should not come here, logging a warning as an alert if we somehow do */
              console.warn("Ingoring overlays because chart type is " + options.type);
              overlays = [];
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
                                }).catch(function(err){
                                    var msg = 'Error getting data for '.i18n() + instrumentName + "";
                                    require(["jquery-growl"], function($) { $.growl.error({ message: msg }); });
                                    var chart = $(containerIDWithHash).highcharts();
                                    chart && chart.showLoading(msg);
                                    console.error(err);
                                  }).then(function() {
                                  var chart = $(containerIDWithHash).highcharts();
                                  /* the data is loaded but is not applied yet, its on the js event loop,
                                     wait till the chart data is applied and then add the indicators */
                                  setTimeout(function() {
                                    chart && chart.set_indicators(indicators); // put back removed indicators
                                    overlays.forEach(function(ovlay){
                                      charts_functions.overlay(containerIDWithHash, ovlay.symbol, ovlay.displaySymbol, ovlay.delay_amount);
                                    });
                                  },0);
                                });
                            })
                            if ($.isFunction(onload)) {
                                onload();
                            }
                            if(getParameterByName("affiliates") === 'true' && getParameterByName('hideFooter').toLowerCase() === 'true'){
                                $(this.credits.element).remove();
                            } else {
                                this.credits.element.onclick = function() {
                                    window.open(
                                        'http://webtrader.binary.com',
                                        '_blank'
                                    );
                                }
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

                plotOptions: {
                    candlestick: {
                        shadow: false
                    },
                    series: {
                        events: {
                            afterAnimate: function () {
                                if (this.options.isInstrument && this.options.id !== "navigator") {
                                    //this.isDirty = true;
                                    //this.isDirtyData = true;

                                    //Add current price indicator
                                    //If we already added currentPriceLine for this series, ignore it
                                    //console.log(this.options.id, this.yAxis.plotLinesAndBands);
                                    this.removeCurrentPrice();
                                    this.addCurrentPrice();

                                    //Add mouse wheel zooming
                                    require(['common/highcharts.mousewheel'], function($Hmw) {
                                        $Hmw.mousewheel(containerIDWithHash);
                                    });

                                }

                                this.chart.hideLoading();
                                //this.chart.redraw();
                            }
                        }
                    }
                },

                title: {
                    //Show name on chart if it is accessed with affiliates = true parameter. In normal webtrader mode, we dont need this title because the dialog will have one
                    text: getParameterByName("affiliates") === 'true' ? options.instrumentName : "" //name to display
                },

                credits: {
                    href: 'http://webtrader.binary.com',
                    text: 'Binary.com : Webtrader',

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

                scrollbar: {
                  liveRedraw: false
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
                    enabled: false,
                    url: 'https://export.highcharts.com',
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

        generate_csv : generate_csv,

        refresh : function ( containerIDWithHash, newTimePeriod, newChartType, indicators, overlays ) {
            var instrumentCode = $(containerIDWithHash).data("instrumentCode");
            if (newTimePeriod)  {
                //Unsubscribe from tickstream.
                var key = chartingRequestMap.keyFor(instrumentCode, $(containerIDWithHash).data("timePeriod"));
                chartingRequestMap.unregister(key, containerIDWithHash);
                $(containerIDWithHash).data("timePeriod", newTimePeriod);
            }
            if(newChartType) $(containerIDWithHash).data("type", newChartType);
            else newChartType = $(containerIDWithHash).data("type", newChartType);

            //Get all series details from this chart
            var chart = $(containerIDWithHash).highcharts();
            var chartObj = this;
            var loadedMarketData = [], series_compare = undefined;
            /* for ohlc and candlestick series_compare must NOT be percent */
            if (newChartType !== 'ohlc' && newChartType !== 'candlestick') {
              $(chart.series).each(function (index, series) {
                console.log('Refreshing : ', series.options.isInstrument, series.options.name);
                if (series.options.isInstrument) {
                    loadedMarketData.push(series.name);
                    //There could be one valid series_compare value per chart
                    series_compare = series.options.compare;
                }
              });
            }
            require(['instruments/instruments'], function (ins) {
                if(!overlays) {
                  overlays = [];
                  loadedMarketData.forEach(function (value) {
                      var marketDataObj = ins.getSpecificMarketData(value);
                      if (marketDataObj.symbol != undefined && $.trim(marketDataObj.symbol) != $(containerIDWithHash).data("instrumentCode"))
                      {
                          var overlay = {
                              symbol: marketDataObj.symbol,
                              displaySymbol: value,
                              delay_amount: marketDataObj.delay_amount
                          };
                          overlays.push(overlay);
                      }
                  });
                }
                chartObj.drawChart( containerIDWithHash, {
                    instrumentCode : instrumentCode,
                    instrumentName : $(containerIDWithHash).data("instrumentName"),
                    timePeriod : $(containerIDWithHash).data("timePeriod"),
                    type : $(containerIDWithHash).data("type"),
                    series_compare : series_compare,
                    delayAmount : $(containerIDWithHash).data("delayAmount"),
                    overlays: overlays,
                    indicators: indicators
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
                var indicator_series = chart.get_indicator_series();
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

                return new Promise(function(resolve, reject){
                  liveapi.execute(function() {
                      ohlc_handler.retrieveChartDataAndRender({
                          timePeriod : mainSeries_timePeriod,
                          instrumentCode : overlayInsCode,
                          containerIDWithHash : containerIDWithHash,
                          type : mainSeries_type,
                          instrumentName : overlayInsName,
                          series_compare : 'percent',
                          delayAmount : delayAmount
                      }).then(function() {
                          chart && chart.set_indicator_series(indicator_series);
                          resolve();
                      }).catch(resolve);
                  });
                });
            }
            return Promise.resolve();
        },

        changeTitle : function ( containerIDWithHash, newTitle ) {
            var chart = $(containerIDWithHash).highcharts();
            chart.setTitle(newTitle);
        }
    }
    return charts_functions;
});
