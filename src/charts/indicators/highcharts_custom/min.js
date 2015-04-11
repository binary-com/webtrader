/**
 * Created by arnab on 3/22/15.
 */
define(['charts/indicators/highcharts_custom/indicator_base', 'highstock'], function (indicatorBase) {

    var minOptionsMap = {}, minSeriesMap = {};

    function calculateIndicatorValue(minOptions, data, index) {
        var minValue = 0.0;
        if (indicatorBase.isOHLCorCandlestick(this.options.type)) {
            minValue = indicatorBase.extractPriceForAppliedTO(minOptions.appliedTo, data, index);
        }
        else {
            minValue = indicatorBase.extractPrice(data, index);
        }
        for (var j = index, count = 1; j >= 0 && count <= minOptions.period; j--, count++) {
            var tempValue = 0.0;
            if (indicatorBase.isOHLCorCandlestick(this.options.type)) {
                tempValue = indicatorBase.extractPriceForAppliedTO(minOptions.appliedTo, data, j);
            }
            else {
                tempValue = indicatorBase.extractPrice(data, j);
            }
            if (minValue > tempValue || minValue == 0.0) {
                minValue = tempValue;
            }
        }
        return minValue;
    }

    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addMIN) return;

                H.Series.prototype.addMIN = function ( minOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    minOptions = $.extend({
                        period : 21,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID : seriesID
                    }, minOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add MIN series to the chart
                    var data = this.options.data || [];
                    //If period is higher than data.length, we cannot calculate MIN. Return from here
                    if (minOptions.period >= data.length) return;

                    if (data && data.length > 0)
                    {

                        //Calculate MIN data
                        /*
                         *  Formula - min price over n, n - period
                         */
                        var minData = [];
                        for (var index = 0; index < data.length; index++)
                        {

                            //Calculate SUM - start
                            if (index >= minOptions.period) {
                                var minValue = calculateIndicatorValue.call(this, minOptions, data, index);
                                minData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(minValue, 5)]);
                            }
                            else
                            {
                                minData.push([(data[index].x || data[index][0]), 0]);
                            }
                            //Calculate SUM - end

                        }

                        var chart = this.chart;

                        minOptionsMap[uniqueID] = minOptions;

                        var series = this;
                        minSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'MIN(' + minOptions.period  + ', ' + indicatorBase.appliedPriceString(minOptions.appliedTo) + ')',
                            data: minData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            //yAxis: 'min'+ uniqueID,
                            opposite: series.options.opposite,
                            color: minOptions.stroke,
                            lineWidth: minOptions.strokeWidth,
                            dashStyle: minOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(minSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'min',
                            isIndicator: true,
                            parentSeriesID: minOptions.parentSeriesID,
                            period: minOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeMIN = function (uniqueID) {
                    var chart = this.chart;
                    minOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    minSeriesMap[uniqueID] = null;
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(minOptionsMap, this.options.id)) {
                        updateMINSeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(minOptionsMap, this.series.options.id)) {
                        updateMINSeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 */
                function updateMINSeries(options, isPointUpdate) {
                    //if this is MIN series, ignore
                    var series = this;
                    var chart = series.chart;

                    //Add a new MIN data point
                    for (var key in minSeriesMap) {
                        if (minSeriesMap[key] && minSeriesMap[key].options && minSeriesMap[key].options.data && minSeriesMap[key].options.data.length > 0) {
                            //This is MIN series. Add one more MIN point
                            //Calculate MIN data
                            /*
                             * Formula - min price over n, n - period
                             */
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                var minValue = calculateIndicatorValue.call(this, minOptionsMap[key], data, dataPointIndex);
                                minValue = indicatorBase.toFixed(minValue, 5);
                                if (isPointUpdate)
                                {
                                    if (minSeriesMap[key].options.data.length < data.length) {
                                        minSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), minValue]);
                                    } else {
                                        minSeriesMap[key].data[dataPointIndex].update([(data[dataPointIndex].x || data[dataPointIndex][0]), minValue]);
                                    }
                                }
                                else
                                {
                                    minSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), minValue]);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    }

});
