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
define(['lokijs', 'jquery', 'common/util'],function(loki, $){

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
        processOHLC: function(open, high, low, close, time, type, dataInHighChartsFormat)
        {
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
        barsLoaded : barsLoaded

    };

});
