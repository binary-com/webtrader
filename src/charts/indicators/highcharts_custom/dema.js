/**
 * Created by Mahboob.M on 12/20/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var demaOptionsMap = {}, demaSeriesMap = {};
    var dema1 = {}, dema2 = {};

    //*************************DEMA*****************************************
    function calculateDEMAValue(demaOptions) {
        //Calculate DEMA data
        /*
         The Double Exponential Moving Average (DEMA) of time series 't' is:
         *      EMA1 = EMA(t,period)
         *      EMA2 = EMA(EMA1,period)
         *      DEMA = 2 * EMA1 - EMA2 
         * Do not fill any value in DemaData from 0 index to options.period-1 index
         */

        var time = (demaOptions.data[demaOptions.index].x || demaOptions.data[demaOptions.index][0]);
        var price = indicatorBase.getPrice(demaOptions.data, demaOptions.index, demaOptions.appliedTo, demaOptions.type);

        var ma1Options = {
            data: demaOptions.data,
            maData: dema1[demaOptions.key],
            index: demaOptions.index,
            period: demaOptions.period,
            type: demaOptions.type,
            appliedTo: demaOptions.appliedTo,
            isIndicatorData: false
        };
        var dema1Value = indicatorBase.calculateEMAValue(ma1Options);
        if (demaOptions.isPointUpdate) {
            dema1[demaOptions.key][demaOptions.index] = [time, dema1Value];
        }
        else {
            dema1[demaOptions.key].push([time, dema1Value]);
        }

        var ma2Options = {
            data: dema1[demaOptions.key],
            maData: dema2[demaOptions.key],
            index: demaOptions.index,
            period: demaOptions.period,
            type: demaOptions.type,
            appliedTo: demaOptions.appliedTo,
            isIndicatorData: true
        };
        var dema2Value = indicatorBase.calculateEMAValue(ma2Options);

        if (demaOptions.isPointUpdate) {
            dema2[demaOptions.key][demaOptions.index] = [time, dema2Value];
        }
        else {
            dema2[demaOptions.key].push([time, dema2Value]);
        }

        return 2 * dema1Value - dema2Value;

    };

    return {
        init: function () {

            (function (H, $, indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addDEMA) return;

                H.Series.prototype.addDEMA = function (demaOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    demaOptions = $.extend({
                        period: 21,
                        stroke: 'red',
                        strokeWidth: 2,
                        dashStyle: 'line',
                        levels: [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID: seriesID
                    }, demaOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ATR series to the chart
                    var data = this.options.data || [];
                    //If period is higher than data.length, we cannot calculate dema. Return from here
                    if (demaOptions.period >= data.length) return;

                    if (data && data.length > 0) {

                        //Calculate DEMA data
                        /*
                         The Double Exponential Moving Average (DEMA) of time series 't' is:
                         *      EMA1 = EMA(t,period)
                         *      EMA2 = EMA(EMA1,period)
                         *      DEMA = 2 * EMA1 - EMA2 
                         * Do not fill any value in DemaData from 0 index to options.period-1 index
                         */

                        var demaData = [];
                        dema1[uniqueID] = [], dema2[uniqueID] = [];
                        for (var index = 0; index < data.length; index++) {
                            var dOptions =
                            {
                                data: data,
                                index: index,
                                period: demaOptions.period,
                                type: this.options.type,
                                key: uniqueID,
                                isPointUpdate: false,
                                appliedTo: demaOptions.appliedTo
                            };
                            var maValue = calculateDEMAValue(dOptions);
                            demaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(maValue, 4)]);
                        }


                        var chart = this.chart;

                        demaOptionsMap[uniqueID] = demaOptions;

                        var series = this;
                        demaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'DEMA (' + demaOptions.period + ', ' + indicatorBase.appliedPriceString(demaOptions.appliedTo) + ')',
                            data: demaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: demaOptions.stroke,
                            lineWidth: demaOptions.strokeWidth,
                            dashStyle: demaOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(demaSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'dema',
                            isIndicator: true,
                            parentSeriesID: demaOptions.parentSeriesID,
                            period: demaOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeDEMA = function (uniqueID) {
                    var chart = this.chart;
                    demaOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    demaSeriesMap[uniqueID] = null;
                    dema1[uniqueID] = [];
                    dema2[uniqueID] = [];
                };

                H.Series.prototype.preRemovalCheckDEMA = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        period: !demaOptionsMap[uniqueID] ? undefined : demaOptionsMap[uniqueID].period,
                        appliedTo: !demaOptionsMap[uniqueID] ? undefined : demaOptionsMap[uniqueID].appliedTo,
                        isValidUniqueID: demaOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(demaOptionsMap, this.options.id)) {
                        updateDEMASeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(demaOptionsMap, this.series.options.id)) {
                        updateDEMASeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 */
                function updateDEMASeries(time, isPointUpdate) {
                    //if this is DEMA series, ignore
                    var series = this;
                    var chart = series.chart;

                    //Add a new DEMA data point
                    for (var key in demaSeriesMap) {
                        if (demaSeriesMap[key] && demaSeriesMap[key].options && demaSeriesMap[key].options.data && demaSeriesMap[key].options.data.length > 0
                            && demaOptionsMap[key].parentSeriesID == series.options.id
                            && demaSeriesMap[key].chart === chart
                        ) {
                            //This is DEMA series. Add one more DEMA point
                            //Calculate DEMA data
                            /*
                             The Double Exponential Moving Average (DEMA) of time series 't' is:
                             *      EMA1 = EMA(t,period)
                             *      EMA2 = EMA(EMA1,period)
                             *      DEMA = 2 * EMA1 - EMA2 
                             * Do not fill any value in DemaData from 0 index to options.period-1 index
                             */
                            //Find the data point
                            var data = series.options.data;
                            var demaOptions = demaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var dOptions =
                                {
                                   data: data,
                                   index: dataPointIndex,
                                   period: demaOptions.period,
                                   type: this.options.type,
                                   key: key,
                                   isPointUpdate: isPointUpdate,
                                   appliedTo: demaOptions.appliedTo
                                };
                                var demaValue = calculateDEMAValue(dOptions);

                                if (isPointUpdate) {
                                    demaSeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(demaValue, 4) });
                                }
                                else {
                                    demaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(demaValue, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    }

});
