/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var maxOptionsMap = {}, maxSeriesMap = {};

    function calculateIndicatorValue(maxOptions, data, index) {
        var maxValue = indicatorBase.getPrice(data, index, maxOptions.appliedTo, this.options.type);
        for (var j = index, count = 1; j >= 0 && count <= maxOptions.period; j--, count++) {
            var tempValue = indicatorBase.getPrice(data, j, maxOptions.appliedTo, this.options.type);
            maxValue = Math.max(maxValue, tempValue);
        }
        return maxValue;
    }

    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addMAX) return;

                H.Series.prototype.addMAX = function ( maxOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    maxOptions = $.extend({
                        period : 21,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID : seriesID
                    }, maxOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ATR series to the chart
                    var data = this.options.data || [];
                    //If period is higher than data.length, we cannot calculate MAX. Return from here
                    if (maxOptions.period >= data.length) return;

                    if (data && data.length > 0)
                    {

                        //Calculate MAX data
                        /*
                         *  Formula - max price over n, n - period
                         */
                        var maxData = [];
                        for (var index = 0; index < data.length; index++)
                        {

                            //Calculate SUM - start
                            if (index >= maxOptions.period) {
                                var maxValue = calculateIndicatorValue.call(this, maxOptions, data, index);
                                maxData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(maxValue, 5)]);
                            }
                            else
                            {
                                maxData.push([(data[index].x || data[index][0]), 0]);
                            }
                            //Calculate SUM - end

                        }

                        var chart = this.chart;

                        maxOptionsMap[uniqueID] = maxOptions;

                        var series = this;
                        maxSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'MAX (' + maxOptions.period  + ', ' + indicatorBase.appliedPriceString(maxOptions.appliedTo) + ')',
                            data: maxData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            //yAxis: 'max'+ uniqueID,
                            opposite: series.options.opposite,
                            color: maxOptions.stroke,
                            lineWidth: maxOptions.strokeWidth,
                            dashStyle: maxOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(maxSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'max',
                            isIndicator: true,
                            parentSeriesID: maxOptions.parentSeriesID,
                            period: maxOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeMAX = function (uniqueID) {
                    var chart = this.chart;
                    maxOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    maxSeriesMap[uniqueID] = null;
                };

                H.Series.prototype.preRemovalCheckMAX = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        period : !maxOptionsMap[uniqueID] ? undefined : maxOptionsMap[uniqueID].period,
                        appliedTo : !maxOptionsMap[uniqueID] ? undefined : maxOptionsMap[uniqueID].appliedTo,
                        isValidUniqueID : maxOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(maxOptionsMap, this.options.id)) {
                        updateMAXSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(maxOptionsMap, this.series.options.id)) {
                        updateMAXSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 */
                function updateMAXSeries(time, isPointUpdate) {
                    //if this is MAX series, ignore
                    var series = this;
                    var chart = series.chart;

                    //Add a new MAX data point
                    for (var key in maxSeriesMap) {
                        if (maxSeriesMap[key] && maxSeriesMap[key].options && maxSeriesMap[key].options.data && maxSeriesMap[key].options.data.length > 0
                            && maxOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is MAX series. Add one more MAX point
                            //Calculate MAX data
                            /*
                             * Formula - max price over n, n - period
                             */
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var maxValue = calculateIndicatorValue.call(this, maxOptionsMap[key], data, dataPointIndex);
                                if (isPointUpdate)
                                {
                                    maxSeriesMap[key].data[dataPointIndex].update({ y : maxValue});
                                }
                                else
                                {
                                    maxSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), maxValue], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    }

});
