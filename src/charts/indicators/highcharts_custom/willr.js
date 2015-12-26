/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var willrOptionsMap = {}, willrSeriesMap = {};

    function calculateIndicatorValue(index, period, data) {
        var highestHigh = 0.0, lowestLow = 0.0;
        for (var j = index, count = 1; j >= 1 && count <= period; j--, count++) {
            if ((data[j][2] || data[j].high || data[j][1] || data[j].y) > highestHigh) {
                highestHigh = data[j][2] || data[j].high || data[j][1] || data[j].y;
            }
            if ((data[j][3] || data[j].low || data[j][1] || data[j].y) < lowestLow || lowestLow == 0.0) {
                lowestLow = data[j][3] || data[j].low || data[j][1] || data[j].y;
            }
        }
        return (highestHigh - indicatorBase.extractPrice(data, index)) * 100 / (highestHigh - lowestLow);
    }

    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addWILLR) return;

                H.Series.prototype.addWILLR = function ( willrOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    willrOptions = $.extend({
                        period : 14,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        parentSeriesID : seriesID
                    }, willrOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add WILLR series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate WILLR data
                        /*
                         * Formula(OHLC or Candlestick) -
                         * 	WILLR = [(Close - Close n periods ago) / (Close n periods ago)] * 100
                         * 		n - period
                         */
                        var willrData = [];
                        for (var index = 0; index < data.length; index++)
                        {

                            //Calculate WILLR - start
                            if (index >= willrOptions.period)
                            {
                                var willrValue = calculateIndicatorValue(index, willrOptions.period, data);
                                if (isFinite(willrValue) && !isNaN(willrValue))
                                {
                                    willrData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(willrValue, 2)]);
                                }
                            }
                            else
                            {
                                willrData.push([(data[index].x || data[index][0]), 0]);
                            }
                            //Calculate WILLR - end

                        }

                        var chart = this.chart;

                        willrOptionsMap[uniqueID] = willrOptions;

                        chart.addAxis({ // Secondary yAxis
                            id: 'willr'+ uniqueID,
                            title: {
                                text: 'WILLR (' + willrOptions.period  + ')',
                                align: 'high',
                                offset: 0,
                                rotation: 0,
                                y: 10, //Trying to show title inside the indicator chart
                                x: 55
                            },
                            lineWidth: 2,
                            plotLines: willrOptions.levels
                        }, false, false, false);

                        indicatorBase.recalculate(chart);

                        var series = this;
                        willrSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'WILLR (' + willrOptions.period  + ')',
                            data: willrData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            yAxis: 'willr'+ uniqueID,
                            opposite: series.options.opposite,
                            color: willrOptions.stroke,
                            lineWidth: willrOptions.strokeWidth,
                            dashStyle: willrOptions.dashStyle
                        }, false, false);

                        $(willrSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'willr',
                            parentSeriesID: willrOptions.parentSeriesID,
                            period: willrOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeWILLR = function (uniqueID) {
                    var chart = this.chart;
                    willrOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    chart.get('willr' + uniqueID).remove(false);
                    willrSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckWILLR = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        period : !willrOptionsMap[uniqueID] ? undefined : willrOptionsMap[uniqueID].period,
                        isValidUniqueID : willrOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pwillreed, options, redraw, shift, animation) {

                    pwillreed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(willrOptionsMap, this.options.id)) {
                        updateWILLRSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pwillreed, options, redraw, animation) {

                    pwillreed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(willrOptionsMap, this.series.options.id)) {
                        updateWILLRSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateWILLRSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new WILLR data point
                    for (var key in willrSeriesMap) {
                        if (willrSeriesMap[key] && willrSeriesMap[key].options && willrSeriesMap[key].options.data && willrSeriesMap[key].options.data.length > 0
                            && willrOptionsMap[key].parentSeriesID == series.options.id
                            && willrSeriesMap[key].chart === chart
                        ) {
                            //This is WILLR series. Add one more WILLR point
                            //Calculate WILLR data
                            /*
                             * Formula(OHLC or Candlestick) -
                             * 	WILLR = [(Close - Close n periods ago) / (Close n periods ago)] * 100
                             * 		n - period
                             */
                            //Find the data point
                            var data = series.options.data;
                            var n = willrOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate WILLR - start
                                var willrValue = calculateIndicatorValue(dataPointIndex, n, data);
                                //console.log('Willr : ' + willrValue);
                                //Calculate WILLR - end
                                willrValue = indicatorBase.toFixed(willrValue , 2);

                                if (isPointUpdate)
                                {
                                    willrSeriesMap[key].data[dataPointIndex].update({ y : willrValue});
                                }
                                else
                                {
                                    willrSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), willrValue], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery,indicatorBase);

        }
    }

});
