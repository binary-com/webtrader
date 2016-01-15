/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var emaOptionsMap = {}, emaSeriesMap = {};

    return {
        init: function () {

            (function (H, $) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addEMA) return;

                H.Series.prototype.addEMA = function (emaOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    emaOptions = $.extend({
                        period: 21,
                        stroke: 'red',
                        strokeWidth: 2,
                        dashStyle: 'line',
                        levels: [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID: seriesID
                    }, emaOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ATR series to the chart
                    var data = this.options.data || [];
                    //If period is higher than data.length, we cannot calculate EMA. Return from here
                    if (emaOptions.period >= data.length) return;

                    if (data && data.length > 0) {

                        //Calculate EMA data
                        /*  ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
                         *  Do not fill any value in emaData from 0 index to options.period-1 index
                         */
                        var emaData = [];
                        for (var index = 0; index < data.length; index++) {
                            var maOptions = {
                                data: data,
                                maData: emaData,
                                index: index,
                                period: emaOptions.period,
                                type: this.options.type,
                                appliedTo: emaOptions.appliedTo,
                                isIndicatorData:false
                            };
                            var maValue = indicatorBase.calculateEMAValue(maOptions);

                            emaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(maValue, 4)]);
                        }

                        var chart = this.chart;

                        emaOptionsMap[uniqueID] = emaOptions;

                        var series = this;
                        emaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'EMA (' + emaOptions.period + ', ' + indicatorBase.appliedPriceString(emaOptions.period) + ')',
                            data: emaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            //yAxis: 'ema'+ uniqueID,
                            opposite: series.options.opposite,
                            color: emaOptions.stroke,
                            lineWidth: emaOptions.strokeWidth,
                            dashStyle: emaOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(emaSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'ema',
                            isIndicator: true,
                            parentSeriesID: emaOptions.parentSeriesID,
                            period: emaOptions.period
                        });
                        //console.log('EMA series data length : ', emaSeriesMap[uniqueID].options.data.length, ', Instrument series data length : ', this.options.data.length);

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeEMA = function (uniqueID) {
                    var chart = this.chart;
                    emaOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    emaSeriesMap[uniqueID] = null;
                };

                H.Series.prototype.preRemovalCheckEMA = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        period : !emaOptionsMap[uniqueID] ? undefined : emaOptionsMap[uniqueID].period,
                        appliedTo : !emaOptionsMap[uniqueID] ? undefined : emaOptionsMap[uniqueID].appliedTo,
                        isValidUniqueID : emaOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(emaOptionsMap, this.options.id)) {
                        updateEMASeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(emaOptionsMap, this.series.options.id)) {
                        updateEMASeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 */
                function updateEMASeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new EMA data point
                    for (var key in emaSeriesMap) {
                        if (emaSeriesMap[key] && emaSeriesMap[key].options && emaSeriesMap[key].options.data && emaSeriesMap[key].options.data.length > 0
                            && emaOptionsMap[key].parentSeriesID == series.options.id
                            && emaSeriesMap[key].chart === chart
                        ) {
                            //This is EMA series. Add one more EMA point
                            //Calculate EMA data
                            /*
                             * ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
                             */
                            //Find the data point
                            var data = series.options.data;
                            var emaData = emaSeriesMap[key].options.data;
                            var emaOptions = emaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var maOptions = {
                                    data: data,
                                    maData: emaData,
                                    index: dataPointIndex,
                                    period: emaOptions.period,
                                    type: this.options.type,
                                    appliedTo: emaOptions.appliedTo,
                                    isIndicatorData: false
                                };
                                var maValue = indicatorBase.calculateEMAValue(maOptions);

                                if (isPointUpdate) {
                                    emaSeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(maValue, 4) });
                                }
                                else {
                                    var shift = false;
                                    if (indicatorBase.isOHLCorCandlestick(this.options.type))
                                        shift = true;
                                    emaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(maValue, 4)], true, shift, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    };
});
