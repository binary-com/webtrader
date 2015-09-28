/**
 * Created by arnab on 3/22/15.
 */
define(['charts/indicators/highcharts_custom/indicator_base', 'highstock'], function (indicatorBase) {

    var rocpOptionsMap = {}, rocpSeriesMap = {};
    
    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addROCP) return;

                H.Series.prototype.addROCP = function ( rocpOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    rocpOptions = $.extend({
                        period : 14,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        parentSeriesID : seriesID
                    }, rocpOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ROCP series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate ROCP data
                        /*
                         * Formula(OHLC or Candlestick) -
                             ROCPP = (Current Price / Price of n bars ago)-1.0)
                             Where: n = Time period
                         */
                        var rocpData = [];
                        for (var index = 0; index < data.length; index++)
                        {

                            //Calculate ROCP - start
                            if (index >= rocpOptions.period)
                            {

                                var rocpValue = (indicatorBase.extractPrice(data, index) - indicatorBase.extractPrice(data, index - rocpOptions.period)) / indicatorBase.extractPrice(data, index - rocpOptions.period);
                                if (isFinite(rocpValue) && !isNaN(rocpValue))
                                {
                                    rocpData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(rocpValue , 5)]);
                                }
                            }
                            else
                            {
                                rocpData.push([(data[index].x || data[index][0]), 0]);
                            }
                            //Calculate ROCP - end

                        }

                        var chart = this.chart;

                        rocpOptionsMap[uniqueID] = rocpOptions;

                        chart.addAxis({ // Secondary yAxis
                            id: 'rocp'+ uniqueID,
                            title: {
                                text: 'ROCP(' + rocpOptions.period  + ')',
                                align: 'high',
                                offset: 0,
                                rotation: 0,
                                y: 10, //Trying to show title inside the indicator chart
                                x: 55
                            },
                            lineWidth: 2,
                            plotLines: rocpOptions.levels
                        }, false, false, false);

                        indicatorBase.recalculate(chart);

                        var series = this;
                        rocpSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'ROCP(' + rocpOptions.period  + ')',
                            data: rocpData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            yAxis: 'rocp'+ uniqueID,
                            opposite: series.options.opposite,
                            color: rocpOptions.stroke,
                            lineWidth: rocpOptions.strokeWidth,
                            dashStyle: rocpOptions.dashStyle
                        }, false, false);

                        $(rocpSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'rocp',
                            parentSeriesID: rocpOptions.parentSeriesID,
                            period: rocpOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeROCP = function (uniqueID) {
                    var chart = this.chart;
                    rocpOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    chart.get('rocp' + uniqueID).remove(false);
                    rocpSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(procpeed, options, redraw, shift, animation) {

                    procpeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(rocpOptionsMap, this.options.id)) {
                        updateROCPSeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(procpeed, options, redraw, animation) {

                    procpeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(rocpOptionsMap, this.series.options.id)) {
                        updateROCPSeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateROCPSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new ROCP data point
                    for (var key in rocpSeriesMap) {
                        if (rocpSeriesMap[key] && rocpSeriesMap[key].options && rocpSeriesMap[key].options.data && rocpSeriesMap[key].options.data.length > 0
                                && rocpOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is ROCP series. Add one more ROCP point
                            //Calculate ROCP data
                            /*
                             * Formula(OHLC or Candlestick) -
                                 ROCPP = (Current Price / Price of n bars ago)-1.0)
                                    Where: n = Time period
                             */
                            //Find the data point
                            var data = series.options.data;
                            var n = rocpOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate ROCP - start
                                var rocpValue = (indicatorBase.extractPrice(data, dataPointIndex) - indicatorBase.extractPrice(data, dataPointIndex - n)) / indicatorBase.extractPrice(data, dataPointIndex - n);
                                //console.log('Roc : ' + rocpValue);
                                //Calculate ROCP - end

                                rocpValue = indicatorBase.toFixed(rocpValue , 5);
                                if (isPointUpdate)
                                {
                                    if (rocpSeriesMap[key].options.data.length < data.length) {
                                        rocpSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), rocpValue]);
                                    } else {
                                        rocpSeriesMap[key].data[dataPointIndex].update([(data[dataPointIndex].x || data[dataPointIndex][0]), rocpValue]);
                                    }
                                }
                                else
                                {
                                    rocpSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), rocpValue]);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery,indicatorBase);

        }
    }

});
