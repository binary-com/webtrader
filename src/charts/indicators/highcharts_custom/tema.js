/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var temaOptionsMap = {}, temaSeriesMap = {};

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

                        var temaData = [];
                        for (var index = 0; index < data.length; index++) {
                            var maOptions = {
                                data: data,
                                index: index,
                                period: temaOptions.period,
                                type: this.options.type,
                                key: uniqueID,
                                isPointUpdate: false,
                                appliedTo: temaOptions.appliedTo,
                                isIndicatorData: false
                            };
                            var maValue = indicatorBase.calculateTEMAValue(maOptions);
                            temaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(maValue, 4)]);
                        }

                        var chart = this.chart;

                        temaOptionsMap[uniqueID] = temaOptions;

                        var series = this;
                        temaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'TEMA (' + temaOptions.period + ', ' + indicatorBase.appliedPriceString(temaOptions.period) + ')',
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
                            period: temaOptions.period
                        });

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
                };

                H.Series.prototype.preRemovalCheckTEMA = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        period : !temaOptionsMap[uniqueID] ? undefined : temaOptionsMap[uniqueID].period,
                        appliedTo : !temaOptionsMap[uniqueID] ? undefined : temaOptionsMap[uniqueID].appliedTo,
                        isValidUniqueID : temaOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(temaOptionsMap, this.options.id)) {
                        updateTEMASeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(temaOptionsMap, this.series.options.id)) {
                        updateTEMASeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 */
                function updateTEMASeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new TEMA data point
                    for (var key in temaSeriesMap) {
                        if (temaSeriesMap[key] && temaSeriesMap[key].options && temaSeriesMap[key].options.data && temaSeriesMap[key].options.data.length > 0
                                && temaOptionsMap[key].parentSeriesID == series.options.id
                            && temaSeriesMap[key].chart === chart
                        ) {
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
                            var temaOptions = temaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var maOptions = {
                                    data: data,
                                    index: dataPointIndex,
                                    period: temaOptions.period,
                                    type: this.options.type,
                                    key: key,
                                    isPointUpdate: isPointUpdate,
                                    appliedTo: temaOptions.appliedTo,
                                    isIndicatorData: false
                                };
                                var maValue = indicatorBase.calculateTEMAValue(maOptions);
                                //var temaValue = indicatorBase.calculateTEMAValue(data, dataPointIndex, temaOptions.period, this.options.type, key, isPointUpdate, temaOptions.appliedTo);

                                if (isPointUpdate) {
                                    temaSeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(maValue, 4) });
                                }
                                else {
                                    temaSeriesMap[key].addPoint([time, indicatorBase.toFixed(maValue, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    };
});
