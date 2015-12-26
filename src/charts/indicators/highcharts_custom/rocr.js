/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var rocrOptionsMap = {}, rocrSeriesMap = {};
    
    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addROCR) return;

                H.Series.prototype.addROCR = function ( rocrOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    rocrOptions = $.extend({
                        period : 14,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        parentSeriesID : seriesID
                    }, rocrOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ROCR series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate ROCR data
                        /*
                         * Formula(OHLC or Candlestick) -
                            ROCR = Current Price / Price of n bars ago
                             Where: n = Time period
                         */
                        var rocrData = [];
                        for (var index = 0; index < data.length; index++)
                        {

                            //Calculate ROCR - start
                            if (index >= rocrOptions.period)
                            {

                                var rocrValue = indicatorBase.extractPrice(data, index) / indicatorBase.extractPrice(data, index - rocrOptions.period);
                                if (isFinite(rocrValue) && !isNaN(rocrValue))
                                {
                                    rocrData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(rocrValue , 5)]);
                                }
                            }
                            else
                            {
                                rocrData.push([(data[index].x || data[index][0]), 0]);
                            }
                            //Calculate ROCR - end

                        }

                        var chart = this.chart;

                        rocrOptionsMap[uniqueID] = rocrOptions;

                        chart.addAxis({ // Secondary yAxis
                            id: 'rocr'+ uniqueID,
                            title: {
                                text: 'ROCR (' + rocrOptions.period  + ')',
                                align: 'high',
                                offset: 0,
                                rotation: 0,
                                y: 10, //Trying to show title inside the indicator chart
                                x: 55
                            },
                            lineWidth: 2,
                            plotLines: rocrOptions.levels
                        }, false, false, false);

                        indicatorBase.recalculate(chart);

                        var series = this;
                        rocrSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'ROCR (' + rocrOptions.period  + ')',
                            data: rocrData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            yAxis: 'rocr'+ uniqueID,
                            opposite: series.options.opposite,
                            color: rocrOptions.stroke,
                            lineWidth: rocrOptions.strokeWidth,
                            dashStyle: rocrOptions.dashStyle
                        }, false, false);

                        $(rocrSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'rocr',
                            parentSeriesID: rocrOptions.parentSeriesID,
                            period: rocrOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeROCR = function (uniqueID) {
                    var chart = this.chart;
                    rocrOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    chart.get('rocr' + uniqueID).remove(false);
                    rocrSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckROCR = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        period : !rocrOptionsMap[uniqueID] ? undefined : rocrOptionsMap[uniqueID].period,
                        isValidUniqueID : rocrOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(procreed, options, redraw, shift, animation) {

                    procreed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(rocrOptionsMap, this.options.id)) {
                        updateROCRSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(procreed, options, redraw, animation) {

                    procreed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(rocrOptionsMap, this.series.options.id)) {
                        updateROCRSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateROCRSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new ROCR data point
                    for (var key in rocrSeriesMap) {
                        if (rocrSeriesMap[key] && rocrSeriesMap[key].options && rocrSeriesMap[key].options.data && rocrSeriesMap[key].options.data.length > 0
                            && rocrOptionsMap[key].parentSeriesID == series.options.id
                            && rocrSeriesMap[key].chart === chart
                        ) {
                            //This is ROCR series. Add one more ROCR point
                            //Calculate ROCR data
                            /*
                             * Formula(OHLC or Candlestick) -
                                ROCR = Current Price / Price of n bars ago
                                 Where: n = Time period
                             */
                            //Find the data point
                            var data = series.options.data;
                            var n = rocrOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate ROCR - start
                                var rocrValue = indicatorBase.extractPrice(data, dataPointIndex) / indicatorBase.extractPrice(data, dataPointIndex - n);
                                //console.log('Roc : ' + rocrValue);
                                //Calculate ROCR - end
                                rocrValue = indicatorBase.toFixed(rocrValue , 5);

                                if (isPointUpdate)
                                {
                                    rocrSeriesMap[key].data[dataPointIndex].update({ y : rocrValue});
                                }
                                else
                                {
                                    rocrSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), rocrValue], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery,indicatorBase);

        }
    }

});
