/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var wmaOptionsMap = {}, wmaSeriesMap = {};

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
                        for (var index = 0; index < data.length; index++) {
                            var maOptions = {
                                data: data,
                                index: index,
                                period: wmaOptions.period,
                                type: this.options.type,
                                appliedTo: wmaOptions.appliedTo,
                                isIndicatorData: false
                            };
                            var maValue = indicatorBase.calculateWMAValue(maOptions);

                            wmaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(maValue, 4)]);
                        }


                        var chart = this.chart;

                        wmaOptionsMap[uniqueID] = wmaOptions;

                        var series = this;
                        wmaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'WMA (' + wmaOptions.period  + ', ' + indicatorBase.appliedPriceString(wmaOptions.appliedTo) + ')',
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
                };

                H.Series.prototype.preRemovalCheckWMA = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        period : !wmaOptionsMap[uniqueID] ? undefined : wmaOptionsMap[uniqueID].period,
                        appliedTo : !wmaOptionsMap[uniqueID] ? undefined : wmaOptionsMap[uniqueID].appliedTo,
                        isValidUniqueID : wmaOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(wmaOptionsMap, this.options.id)) {
                        updateWMASeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(wmaOptionsMap, this.series.options.id)) {
                        updateWMASeries.call(this.series, this.x, true);
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
                            && wmaOptionsMap[key].parentSeriesID == series.options.id
                            && wmaSeriesMap[key].chart === chart
                        ) {
                            //This is WMA series. Add one more WMA point
                            //Calculate WMA data
                            /*
                                 WMA = ( Price * n + Price(1) * n-1 + ... Price( n-1 ) * 1) / ( n * ( n + 1 ) / 2 )
                                 Where: n = time period
                             */
                            //Find the data point
                            var wmaData = wmaSeriesMap[key].options.data;
                            var wmaOptions = wmaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, options);
                            if (dataPointIndex >= 1) {
                                var maOptions = {
                                    data: data,
                                    index: dataPointIndex,
                                    period: wmaOptions.period,
                                    type: this.options.type,
                                    appliedTo: wmaOptions.appliedTo,
                                    isIndicatorData: false
                                };
                                var maValue = indicatorBase.calculateWMAValue(maOptions);

                                if (isPointUpdate)
                                {
                                    wmaSeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(maValue, 4) });
                                }
                                else
                                {
                                    wmaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(maValue, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    }

});
