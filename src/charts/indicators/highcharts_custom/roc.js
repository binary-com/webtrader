/**
 * Created by arnab on 3/22/15.
 */
define(['charts/indicators/highcharts_custom/indicator_base', 'highstock'], function (indicatorBase) {

    var rocOptionsMap = {}, rocSeriesMap = {};
    
    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addROC) return;

                H.Series.prototype.addROC = function ( rocOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    rocOptions = $.extend({
                        period : 14,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        parentSeriesID : seriesID
                    }, rocOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ROC series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate ROC data
                        /*
                         * Formula(OHLC or Candlestick) -
                         * 	ROC = [(Close - Close n periods ago) / (Close n periods ago)] * 100
                         * 		n - period
                         */
                        var rocData = [];
                        for (var index = 0; index < data.length; index++)
                        {

                            //Calculate ROC - start
                            if (index >= rocOptions.period)
                            {

                                var rocValue = (indicatorBase.extractPrice(data, index) - indicatorBase.extractPrice(data, index - rocOptions.period)) * 100 / indicatorBase.extractPrice(data, index - rocOptions.period);
                                if (isFinite(rocValue) && !isNaN(rocValue))
                                {
                                    rocData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(rocValue , 2)]);
                                }
                            }
                            else
                            {
                                rocData.push([(data[index].x || data[index][0]), 0]);
                            }
                            //Calculate ROC - end

                        }

                        var chart = this.chart;

                        rocOptionsMap[uniqueID] = rocOptions;

                        chart.addAxis({ // Secondary yAxis
                            id: 'roc'+ uniqueID,
                            title: {
                                text: 'ROC(' + rocOptions.period  + ')',
                                align: 'high',
                                offset: 0,
                                rotation: 0,
                                y: 10, //Trying to show title inside the indicator chart
                                x: 50
                            },
                            lineWidth: 2,
                            plotLines: rocOptions.levels
                        }, false, false, false);

                        indicatorBase.recalculate(chart);

                        var series = this;
                        rocSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'ROC(' + rocOptions.period  + ')',
                            data: rocData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            yAxis: 'roc'+ uniqueID,
                            opposite: series.options.opposite,
                            color: rocOptions.stroke,
                            lineWidth: rocOptions.strokeWidth,
                            dashStyle: rocOptions.dashStyle
                        }, false, false);

                        $(rocSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'roc',
                            parentSeriesID: rocOptions.parentSeriesID,
                            period: rocOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeROC = function (uniqueID) {
                    var chart = this.chart;
                    rocOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    chart.get('roc' + uniqueID).remove(false);
                    rocSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(rocOptionsMap, this.options.id)) {
                        updateROCSeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(rocOptionsMap, this.series.options.id)) {
                        updateROCSeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateROCSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new ROC data point
                    for (var key in rocSeriesMap) {
                        if (rocSeriesMap[key] && rocSeriesMap[key].options && rocSeriesMap[key].options.data && rocSeriesMap[key].options.data.length > 0) {
                            //This is ROC series. Add one more ROC point
                            //Calculate ROC data
                            /*
                             * Formula(OHLC or Candlestick) -
                             * 	ROC = [(Close - Close n periods ago) / (Close n periods ago)] * 100
                             * 		n - period
                             */
                            //Find the data point
                            var data = series.options.data;
                            var n = rocOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate ROC - start
                                var rocValue = (indicatorBase.extractPrice(data, dataPointIndex) - indicatorBase.extractPrice(data, dataPointIndex - n)) * 100 / indicatorBase.extractPrice(data, dataPointIndex - n);
                                //console.log('Roc : ' + rocValue);
                                //Calculate ROC - end
                                rocValue = indicatorBase.toFixed(rocValue, 2);

                                if (isPointUpdate)
                                {
                                    if (rocSeriesMap[key].options.data.length < data.length) {
                                        rocSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), rocValue]);
                                    } else {
                                        rocSeriesMap[key].data[dataPointIndex].update([(data[dataPointIndex].x || data[dataPointIndex][0]), rocValue]);
                                    }
                                }
                                else
                                {
                                    rocSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), rocValue]);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery,indicatorBase);

        }
    }

});
