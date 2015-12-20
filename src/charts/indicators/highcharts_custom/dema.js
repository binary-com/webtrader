/**
 * Created by Mahboob.M on 12/20/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var demaOptionsMap = {}, demaSeriesMap = {};
    var dema1 = {}, dema2 = {};

    //*************************DEMA*****************************************
    function calculateDEMAValue (data, index, period, type, key, isPointUpdate, appliedTo) {
        //Calculate DEMA data
        /*
         The Double Exponential Moving Average (DEMA) of time series 't' is:
         *      EMA1 = EMA(t,period)
         *      EMA2 = EMA(EMA1,period)
         *      DEMA = 2 * EMA1 - EMA2 
         * Do not fill any value in DemaData from 0 index to options.period-1 index
         */
        var time = (data[index].x || data[index][0]);
        if (!dema1[key]) {
            dema1[key] = [], dema2[key] = [];
            //*If it hasn't been called for index zero to period-1
            if (index === period - 1) {
                for (var i = 0; i < period - 1; i++) {
                    dema1[key].push([time, null]);
                    dema2[key].push([time, null]);
                }
            }
        };

        var price = indicatorBase.getPrice(data, index, appliedTo, type);

        var dema1Value = indicatorBase.calculateEMAValue(data, dema1[key], index, period, type, appliedTo);
        if (isPointUpdate) {
            dema1[key][index] = [time, dema1Value];
        }
        else {
            dema1[key].push([time, dema1Value]);
        }

        var dema2Value = indicatorBase.calculateEMAValue(dema1[key], dema2[key], index, period, type, appliedTo);

        if (isPointUpdate) {
            dema2[key][index] = [time, dema2Value];
        }
        else {
            dema2[key].push([time, dema2Value]);
        }
       
        return  2 * dema1Value - dema2Value;

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
                        for (var index = 0; index < data.length; index++) {
                            var maValue = calculateDEMAValue(data, index, demaOptions.period, this.options.type, uniqueID, false, demaOptions.appliedTo);
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
                            && demaOptionsMap[key].parentSeriesID == series.options.id) {
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
                            var demaData = demaSeriesMap[key].options.data;
                            var demaOptions = demaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var demaValue = calculateDEMAValue(data, dataPointIndex, demaOptions.period, this.options.type, key, isPointUpdate, demaOptions.appliedTo);

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
