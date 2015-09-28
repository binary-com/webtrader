/**
 * Created by arnab on 3/22/15.
 */
define(['charts/indicators/highcharts_custom/indicator_base', 'highstock'], function (indicatorBase) {

    var sumOptionsMap = {}, sumSeriesMap = {};

    function calculateIndicatorValue(index, sumOptions, data) {
        var sumValue = 0.0;
        for (var j = index, count = 1; j >= 0 && count <= sumOptions.period; j--, count++) {
            sumValue += indicatorBase.extractPrice(data, j);
        }
        return sumValue;
    }

    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addSUM) return;

                H.Series.prototype.addSUM = function ( sumOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    sumOptions = $.extend({
                        period : 14,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        parentSeriesID : seriesID
                    }, sumOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add SUM series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate SUM data
                        /*
                         * Formula(OHLC or Candlestick) -
                         * 	SUM = Sum of price over n
                         * 		n - period
                         */
                        var sumData = [];
                        for (var index = 0; index < data.length; index++)
                        {

                            //Calculate SUM - start
                            if (index >= sumOptions.period) {
                                var sumValue = calculateIndicatorValue(index, sumOptions, data);
                                sumData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(sumValue, 5)]);
                            }
                            else
                            {
                                sumData.push([(data[index].x || data[index][0]), 0]);
                            }
                            //Calculate SUM - end

                        }

                        var chart = this.chart;

                        sumOptionsMap[uniqueID] = sumOptions;

                        chart.addAxis({ // Secondary yAxis
                            id: 'sum'+ uniqueID,
                            title: {
                                text: 'SUM(' + sumOptions.period  + ')',
                                align: 'high',
                                offset: 0,
                                rotation: 0,
                                y: 10, //Trying to show title inside the indicator chart
                                x: 50
                            },
                            lineWidth: 2,
                            plotLines: sumOptions.levels
                        }, false, false, false);

                        indicatorBase.recalculate(chart);

                        var series = this;
                        sumSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'SUM(' + sumOptions.period  + ')',
                            data: sumData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            yAxis: 'sum'+ uniqueID,
                            opposite: series.options.opposite,
                            color: sumOptions.stroke,
                            lineWidth: sumOptions.strokeWidth,
                            dashStyle: sumOptions.dashStyle
                        }, false, false);

                        $(sumSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'sum',
                            parentSeriesID: sumOptions.parentSeriesID,
                            period: sumOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeSUM = function (uniqueID) {
                    var chart = this.chart;
                    sumOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    chart.get('sum' + uniqueID).remove(false);
                    sumSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(psumeed, options, redraw, shift, animation) {

                    psumeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(sumOptionsMap, this.options.id)) {
                        updateSUMSeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(psumeed, options, redraw, animation) {

                    psumeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(sumOptionsMap, this.series.options.id)) {
                        updateSUMSeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateSUMSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new SUM data point
                    for (var key in sumSeriesMap) {
                        if (sumSeriesMap[key] && sumSeriesMap[key].options && sumSeriesMap[key].options.data && sumSeriesMap[key].options.data.length > 0
                            && sumOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is SUM series. Add one more SUM point
                            //Calculate SUM data
                            /*
                             * Formula(OHLC or Candlestick) -
                             * 	SUM = Sum of price over n
                             * 		n - period
                             */
                            //Find the data point
                            var data = series.options.data;
                            var smaData = sumSeriesMap[key].options.data;
                            var n = sumOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate SUM - start
                                var sumValue = calculateIndicatorValue(dataPointIndex, sumOptionsMap[key], data);
                                //console.log('Sum : ' + sumValue);
                                //Calculate SUM - end
                                sumValue = indicatorBase.toFixed(sumValue , 5);

                                if (isPointUpdate)
                                {
                                    if (sumSeriesMap[key].options.data.length < data.length) {
                                        sumSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), sumValue]);
                                    } else {
                                        sumSeriesMap[key].data[dataPointIndex].update([(data[dataPointIndex].x || data[dataPointIndex][0]), sumValue]);
                                    }
                                }
                                else
                                {
                                    sumSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), sumValue]);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery,indicatorBase);

        }
    }

});
