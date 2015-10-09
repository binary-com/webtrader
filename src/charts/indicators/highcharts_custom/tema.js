/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var temaOptionsMap = {}, temaSeriesMap = {}, ema1 = {}, ema2 = {}, ema3 = {};

    function initEMAData(period, data) {
        var temaData = [], sum = 0.0;
        for (var index = 0; index < period; index++) {
            sum += data[index][1];
            if (index == (period - 1)) {
                var val = sum / period;
                if (!$.isNumeric(val)) {
                    val = data[index][1];
                }
                temaData.push([data[index][0], val]);
            }
            else {
                temaData.push([data[index][0], null]);
            }
        }

        for (var index = period; index < data.length; index++) {

            var price = data[index][1];

            //Calculate EMA - start
            //ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
            var temaValue = (price * 2 / (period + 1)) + (temaData[index - 1][1] * (1 - 2 / (period + 1)))
            temaData.push([data[index][0], indicatorBase.toFixed(temaValue, 4)]);
            //Calculate EMA - end

        }
        return temaData;
    }

    return {
        init: function () {

            (function (H, $) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addTEMA) return;

                H.Series.prototype.addTEMA = function (temaOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    temaOptions = $.extend({
                        period: 21,
                        stroke: 'red',
                        strokeWidth: 2,
                        dashStyle: 'line',
                        levels: [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID: seriesID
                    }, temaOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ATR series to the chart
                    var data = this.options.data || [];
                    //If period is higher than data.length, we cannot calculate TEMA. Return from here
                    if (temaOptions.period >= data.length) return;

                    if (data && data.length > 0) {

                        //Calculate TEMA data
                        /*
                         The Triple Exponential Moving Average (TEMA) of time series 't' is:
                         *      EMA1 = EMA(t,period)
                         *      EMA2 = EMA(EMA1,period)
                         *      EMA3 = EMA(EMA2,period))
                         *      TEMA = 3*EMA1 - 3*EMA2 + EMA3
                         * Do not fill any value in temaData from 0 index to options.period-1 index
                         */
                        var inputData = [], period = temaOptions.period;
                        //Prepare input data for indicator value calculation
                        for (var index = 0; index < data.length; index++) {
                            if (indicatorBase.isOHLCorCandlestick(this.options.type)) {
                                inputData.push([data[index].x ? data[index].x : data[index][0], indicatorBase.extractPriceForAppliedTO(temaOptions.appliedTo, data, index)]);
                            }
                            else {
                                inputData.push([data[index].x ? data[index].x : data[index][0], data[index].y ? data[index].y : data[index][1]]);
                            }
                        }
                        var ema1Data = initEMAData.call(this, period, inputData);
                        var ema2Data = initEMAData.call(this, period, ema1Data);
                        var ema3Data = initEMAData.call(this, period, ema2Data);
                        var temaData = [];
                        for (var index = 0; index < ema3Data.length; index++) {
                            var temaVal = 3 * ema1Data[index][1] - 3 * ema2Data[index][1] + ema3Data[index][1];
                            temaData.push([ema3Data[index][0], indicatorBase.toFixed(temaVal, 4)]);
                        }
                        ema1[uniqueID] = ema1Data;
                        ema2[uniqueID] = ema2Data;
                        ema3[uniqueID] = ema3Data;

                        var chart = this.chart;

                        temaOptionsMap[uniqueID] = temaOptions;

                        var series = this;
                        temaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'TEMA(' + period + ', ' + indicatorBase.appliedPriceString(period) + ')',
                            data: temaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            //yAxis: 'tema'+ uniqueID,
                            opposite: series.options.opposite,
                            color: temaOptions.stroke,
                            lineWidth: temaOptions.strokeWidth,
                            dashStyle: temaOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(temaSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'tema',
                            isIndicator: true,
                            parentSeriesID: temaOptions.parentSeriesID,
                            period: period
                        });
                        //console.log('TEMA series data length : ', temaSeriesMap[uniqueID].options.data.length, ', Instrument series data length : ', this.options.data.length);

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeTEMA = function (uniqueID) {
                    var chart = this.chart;
                    temaOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    temaSeriesMap[uniqueID] = null;
                    ema1[uniqueID] = [];
                    ema2[uniqueID] = [];
                    ema3[uniqueID] = [];
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(temaOptionsMap, this.options.id)) {
                        updateTEMASeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(temaOptionsMap, this.series.options.id)) {
                        updateTEMASeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 */
                function updateTEMASeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new TEMA data point
                    for (var key in temaSeriesMap) {
                        if (temaSeriesMap[key] && temaSeriesMap[key].options && temaSeriesMap[key].options.data && temaSeriesMap[key].options.data.length > 0
                                && temaOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is TEMA series. Add one more TEMA point
                            //Calculate TEMA data
                            /*
                             * The Triple Exponential Moving Average (TEMA) of time series 't' is:
                             *      EMA1 = EMA(t,period)
                             *      EMA2 = EMA(EMA1,period)
                             *      EMA3 = EMA(EMA2,period))
                             *      TEMA = 3*EMA1 - 3*EMA2 + EMA3
                             **/
                            //Find the data point
                            var data = series.options.data;
                            var n = temaOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                var price = 0.0;
                                if (indicatorBase.isOHLCorCandlestick(this.options.type)) {
                                    price = indicatorBase.extractPriceForAppliedTO(temaOptionsMap[key].appliedTo, data, dataPointIndex);
                                }
                                else {
                                    price = data[dataPointIndex].y ? data[dataPointIndex].y : data[dataPointIndex][1];
                                }

                                var ema1Value = (price * 2 / (n + 1)) + (ema1[key][dataPointIndex - 1][1] * (1 - 2 / (n + 1)))
                                    , ema2Value = (ema1Value * 2 / (n + 1)) + (ema2[key][dataPointIndex - 1][1] * (1 - 2 / (n + 1)))
                                    , ema3Value = (ema2Value * 2 / (n + 1)) + (ema3[key][dataPointIndex - 1][1] * (1 - 2 / (n + 1)));
                                var temaValue = 3*ema1Value - 3*ema2Value + ema3Value;
                                ema1Value = indicatorBase.toFixed(ema1Value, 4);
                                ema2Value = indicatorBase.toFixed(ema2Value, 4);
                                ema3Value = indicatorBase.toFixed(ema3Value, 4);
                                temaValue = indicatorBase.toFixed(temaValue, 4);

                                var time = (data[dataPointIndex].x || data[dataPointIndex][0]);
                                //Calculate TEMA - start
                                //console.log(temaValue, price, n, temaData[dataPointIndex - 1]);
                                if (isPointUpdate) {
                                    if (temaSeriesMap[key].options.data.length < data.length) {
                                        ema1[key].push([time, ema1Value]);
                                        ema2[key].push([time, ema2Value]);
                                        ema3[key].push([time, ema3Value]);
                                        temaSeriesMap[key].addPoint([time, temaValue]);
                                    } else {
                                        ema1[key][dataPointIndex] = [time, ema1Value];
                                        ema2[key][dataPointIndex] = [time, ema2Value];
                                        ema3[key][dataPointIndex] = [time, ema3Value];
                                        temaSeriesMap[key].data[dataPointIndex].update([time, temaValue]);
                                    }
                                }
                                else {
                                    ema1[key].push([time, ema1Value]);
                                    ema2[key].push([time, ema2Value]);
                                    ema3[key].push([time, ema3Value]);
                                    temaSeriesMap[key].addPoint([time, temaValue]);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    };
});
