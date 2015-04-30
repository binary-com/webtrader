/**
 * Created by arnab on 3/22/15.
 */
define(['charts/indicators/highcharts_custom/indicator_base', 'highstock'], function (indicatorBase) {

    var wmaOptionsMap = {}, wmaSeriesMap = {};

    function calculateIndicatorValue(index, wmaOptions, data) {
        var wmaValue = 0;
        for (var subIndex = index, count = wmaOptions.period; subIndex >= 0 && count >= 0; count--, subIndex--) {
            var price = 0.0;
            if (indicatorBase.isOHLCorCandlestick(this.options.type)) {
                price = indicatorBase.extractPriceForAppliedTO(wmaOptions.appliedTo, data, subIndex);
            }
            else {
                price = data[subIndex].y ? data[subIndex].y : data[subIndex][1];
            }
            wmaValue += price * count;
        }
        return wmaValue / (wmaOptions.period * (wmaOptions.period + 1) / 2);
    }

    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addWMA) return;

                H.Series.prototype.addWMA = function ( wmaOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    wmaOptions = $.extend({
                        period : 21,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID : seriesID
                    }, wmaOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ATR series to the chart
                    var data = this.options.data || [];
                    //If period is higher than data.length, we cannot calculate WMA. Return from here
                    if (wmaOptions.period >= data.length) return;

                    if (data && data.length > 0)
                    {

                        //Calculate WMA data
                        /*
                            WMA = ( Price * n + Price(1) * n-1 + ... Price( n-1 ) * 1) / ( n * ( n + 1 ) / 2 )
                            Where: n = time period
                         *
                         *  Do not fill any value in wmaData from 0 index to options.period-1 index

                         */
                        var wmaData = [];
                        for (var index = 0; index < wmaOptions.period; index++)
                        {
                            wmaData.push([data[wmaOptions.period - 1].x ? data[wmaOptions.period - 1].x : data[wmaOptions.period - 1][0], null]);
                        }

                        for (var index = wmaOptions.period; index < data.length; index++) {

                            //Calculate WMA - start
                            var wmaValue = calculateIndicatorValue.call(this, index, wmaOptions, data);
                            wmaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(wmaValue, 4)]);
                            //Calculate WMA - end

                        }

                        var chart = this.chart;

                        wmaOptionsMap[uniqueID] = wmaOptions;

                        var series = this;
                        wmaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'WMA(' + wmaOptions.period  + ', ' + indicatorBase.appliedPriceString(wmaOptions.appliedTo) + ')',
                            data: wmaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            //yAxis: 'wma'+ uniqueID,
                            opposite: series.options.opposite,
                            color: wmaOptions.stroke,
                            lineWidth: wmaOptions.strokeWidth,
                            dashStyle: wmaOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(wmaSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'wma',
                            isIndicator: true,
                            parentSeriesID: wmaOptions.parentSeriesID,
                            period: wmaOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeWMA = function (uniqueID) {
                    var chart = this.chart;
                    wmaOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    wmaSeriesMap[uniqueID] = null;
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(wmaOptionsMap, this.options.id)) {
                        updateWMASeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(wmaOptionsMap, this.series.options.id)) {
                        updateWMASeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 */
                function updateWMASeries(options, isPointUpdate) {
                    //if this is WMA series, ignore
                    var series = this;
                    var chart = series.chart;
                    var data = series.options.data;

                    //Add a new WMA data point
                    for (var key in wmaSeriesMap) {
                        if (wmaSeriesMap[key] && wmaSeriesMap[key].options && wmaSeriesMap[key].options.data && wmaSeriesMap[key].options.data.length > 0
                                        && wmaOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is WMA series. Add one more WMA point
                            //Calculate WMA data
                            /*
                                 WMA = ( Price * n + Price(1) * n-1 + ... Price( n-1 ) * 1) / ( n * ( n + 1 ) / 2 )
                                 Where: n = time period
                             */
                            //Find the data point
                            var wmaData = wmaSeriesMap[key].options.data;

                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate WMA - start
                                var wmaValue = calculateIndicatorValue.call(this, dataPointIndex, wmaOptionsMap[key], data);
                                wmaValue = indicatorBase.toFixed(wmaValue, 4);
                                if (isPointUpdate)
                                {
                                    if (wmaSeriesMap[key].options.data.length < data.length) {
                                        wmaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), wmaValue]);
                                    } else {
                                        wmaSeriesMap[key].data[dataPointIndex].update([(data[dataPointIndex].x || data[dataPointIndex][0]), wmaValue]);
                                    }
                                }
                                else
                                {
                                    wmaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), wmaValue]);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    }

});
