/**
 * Created by amin on October 15,2015.
 */

/**
    Key is instrumentCode+timePeriod(in seconds), Value is
        {
            timerHandler : ,
            chartIDs : [
                {
                    containerIDWithHash : containerIDWithHash,
                    series_compare : series_compare,
                    instrumentCode : instrumentCode,
                    instrumentName : instrumentName
                }
            ]
        }
**/
define(['lokijs', 'jquery', 'websockets/binary_websockets', 'common/util'],function(loki, $, liveapi){

    var db = new loki();
    var barsTable = db.addCollection('bars_table');
    // TODO: add common tasks for chartingRequestMap to this module
    //       move code from charts.js, ohlc_handler.js, stream_handler.js and symbol_handler.js


    function barsLoaded(instrumentCdAndTp) {

        var key = instrumentCdAndTp;
        if (!this[key] || !this[key].chartIDs) return;

        var chartIDList = this[key].chartIDs;
        var processOHLC = this.processOHLC;

        chartIDList.forEach(function(chartID) {

            if (!chartID) return;

            var series = $(chartID.containerIDWithHash).highcharts().get(key),
                type = $(chartID.containerIDWithHash).data('type');

            if (series) { //Update mode

                var lastBarOpenTime = series.data[series.data.length - 1].x || series.data[series.data.length - 1].time;
                var db_bars = barsTable
                                .chain()
                                .find({instrumentCdAndTp: key})
                                .where(function (obj) {
                                    return obj.time >= lastBarOpenTime;
                                })
                                .simplesort('time', false).data();

                for (var index in db_bars) {
                    var dbBar = db_bars[index];
                    //If the bar already exists, then update it, else add a new bar
                    var foundBar = undefined;
                    for (var indx = series.data.length - 1; indx >= 0; indx--) {
                        var value = series.data[indx];
                        if (value && dbBar.time == (value.x || value.time)) {
                            foundBar = value;
                            break;
                        }
                    }
                    if (foundBar) {
                        if (type && isDataTypeClosePriceOnly(type)) {
                            foundBar.update([dbBar.time, dbBar.close], false);
                        } else {
                            foundBar.update([dbBar.time, dbBar.open, dbBar.high, dbBar.low, dbBar.close], false);
                        }
                    } else {
                        if (type && isDataTypeClosePriceOnly(type)) {
                            series.addPoint([dbBar.time, dbBar.close], false, true);
                        } else {
                            series.addPoint([dbBar.time, dbBar.open, dbBar.high, dbBar.low, dbBar.close], false, true);
                        }
                    }
                }
                //We have to mark it dirty because for OHLC, Highcharts leave some weird marks on chart that do not belong to OHLC
                series.isDirty = true;
                series.isDirtyData = true;
                series.chart.redraw();

            }
            else {

                //First time rendering
                var chart = $(chartID.containerIDWithHash).highcharts();
                //We just want to get bars which are after the last complete rendered bar on chart(excluding the currently forming bar because that might change its values)
                var dataInHighChartsFormat = [];

                var db_bars = barsTable
                                .chain()
                                .find({instrumentCdAndTp: key})
                                .simplesort('time', false)
                                .data();
                for (var barIndex in db_bars) {
                    processOHLC(db_bars[barIndex].open, db_bars[barIndex].high, db_bars[barIndex].low, db_bars[barIndex].close,
                        db_bars[barIndex].time, type, dataInHighChartsFormat);
                }

                if (!chart) return;

                //set the range
                var totalLength = dataInHighChartsFormat.length;
                var endIndex = dataInHighChartsFormat.length > 30 ? totalLength - 30 : 0;

                var instrumentName = chartID.instrumentName;
                var series_compare = chartID.series_compare;
                console.log('Rendering for : ', key, instrumentName, series_compare);

                //Find out how many instrument series are loaded on chart
                var countInstrumentCharts = 0;
                chart.series.forEach(function(series) {
                    console.log(series.options.isInstrument);
                    if (series.options.isInstrument && series.options.id !== "navigator") {
                        ++countInstrumentCharts;
                    }
                });
                if (countInstrumentCharts === 0) {
                    chart.xAxis[0].range = dataInHighChartsFormat[totalLength - 1][0] - dataInHighChartsFormat[endIndex][0]; //show 30 bars
                }

                var seriesConf = {
                    id: key,
                    name: instrumentName,
                    data: dataInHighChartsFormat,
                    type: type ? type : 'candlestick', //area, candlestick, line, areaspline, column, ohlc, scatter, dot, linedot
                    dataGrouping: {
                        enabled: false
                    },
                    compare: series_compare,
                    states: {
                        hover: {
                            enabled: false
                        }
                    },
                    isInstrument : true //Its our variable
                };
                if (isLineDotType(type) || isDotType(type)) {
                    seriesConf.type = 'line';
                    if (isDotType(type)) {
                        seriesConf.dashStyle = 'dot';
                    }
                    seriesConf.marker = {
                        enabled: !isDotType(type),
                        radius: 4
                    };
                }
                chart.addSeries(seriesConf);

            }

        });

    }

    return {
        barsTable: barsTable,
        processOHLC: function(open, high, low, close, time, type, dataInHighChartsFormat) {
            //Ignore if last known bar time is greater than this new bar time
            if (dataInHighChartsFormat.length > 0 && dataInHighChartsFormat[dataInHighChartsFormat.length - 1][0] > time) return;

            if (type && isDataTypeClosePriceOnly(type))
            {
                if (!$.isNumeric(time) || !$.isNumeric(close)) return;
                dataInHighChartsFormat.push([time, close]);
            }
            else
            {
                if (!$.isNumeric(time) || !$.isNumeric(open) || !$.isNumeric(high) || !$.isNumeric(low) || !$.isNumeric(close)) return;
                dataInHighChartsFormat.push([time, open, high, low, close]);
            }
        },
        barsLoaded : barsLoaded,

        keyFor: function(symbol, granularity_or_timeperiod) {
            var granularity = granularity_or_timeperiod || 0;
            if(typeof granularity === 'string') {
                granularity = convertToTimeperiodObject(granularity).timeInSeconds();
            }
            return (symbol + granularity).toUpperCase();
        },

        /*  options: {
              symbol,
              granularity: // could be a number or a string in 1t, 2m, 3h, 4d format.
                           // if a string is present it will be converted to seconds
              subscribe: // default = 1,
              style: // default = 'ticks',
              count: // default = 1,
              adjust_start_time?: // only will be added to the request if present
            }
            will return a promise
        */
        register: function(options) {
            var granularity = options.granularity || 0;
            var style = options.style || 'ticks';

            var is_tick = true;
            if(typeof granularity === 'string') {
                if ($.trim(granularity) === '0') {
                } else if($.trim(granularity).toLowerCase() === '1t') {
                    granularity = convertToTimeperiodObject(granularity).timeInSeconds();
                } else {
                    is_tick = false;
                    granularity = convertToTimeperiodObject(granularity).timeInSeconds();
                }
            }

            var req = {
                "ticks_history": options.symbol,
                "granularity": granularity,
                "subscribe": options.subscribe || 0,
                "count": options.count || 1,
                "end": 'latest',
                "style": style
            };

            if(!is_tick) {
              var count = options.count || 1;
              var start = (new Date().getTime() / 1000 - count * granularity) | 0;

              //If the start time is less than 3 years, adjust the start time
              var _3YearsBack = new Date();
              _3YearsBack.setUTCFullYear(_3YearsBack.getUTCFullYear() - 3);
              //Going back exactly 3 years fails. I am adding 1 day
              _3YearsBack.setDate(_3YearsBack.getDate() + 1);

              if ((start * 1000) < _3YearsBack.getTime()) { start = (_3YearsBack.getTime() / 1000) | 0; }

              req.style = 'candles';
              req.start = start;
              req.adjust_start_time = options.adjust_start_time || 1;
            }

            var map = this;
            var key = map.keyFor(options.symbol, granularity);
            map[key] = { symbol: options.symbol, granularity: granularity, chartIDs: [] };
            return liveapi.send(req, /*timeout:*/ 30*1000) // 30 second timeout
                   .catch(function(up){
                      delete map[key];
                      throw up;
                   });

        }
    };

});
