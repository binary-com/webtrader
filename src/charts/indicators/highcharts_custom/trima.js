/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var trimaOptionsMap = {}, trimaSeriesMap = {};
    
    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addTRIMA) return;

                H.Series.prototype.addTRIMA = function ( trimaOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    trimaOptions = $.extend({
                        period : 21,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID : seriesID
                    }, trimaOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ATR series to the chart
                    var data = this.options.data || [];
                    //If period is higher than data.length, we cannot calculate TRIMA. Return from here
                    if (trimaOptions.period >= data.length) return;

                    if (data && data.length > 0)
                    {

                        //Calculate TRIMA data
                        /*

                             MA = ( SMA ( SMAm, Nm ) ) / Nm

                             Where:

                             N = Time periods + 1
                             Nm = Round ( N / 2 )
                             SMAm = ( Sum ( Price, Nm ) ) / Nm
                         *
                         *  Do not fill any value in trimaData from 0 index to options.period-1 index

                         */
                       
                        var trimaData = [];
                        for (var index = 0; index < data.length; index++) {
                            var maOptions = {
                                data: data,
                                maData: trimaData,
                                index: index,
                                period: trimaOptions.period,
                                type: this.options.type,
                                appliedTo: trimaOptions.appliedTo,
                            };
                            var maValue = indicatorBase.calculateTRIMAValue(maOptions);

                            trimaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(maValue, 4)]);
                        }


                        var chart = this.chart;

                        trimaOptionsMap[uniqueID] = trimaOptions;

                        var series = this;
                        trimaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'TRIMA (' + trimaOptions.period  + ', ' + indicatorBase.appliedPriceString(trimaOptions.appliedTo) + ')',
                            data: trimaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            //yAxis: 'trima'+ uniqueID,
                            opposite: series.options.opposite,
                            color: trimaOptions.stroke,
                            lineWidth: trimaOptions.strokeWidth,
                            dashStyle: trimaOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(trimaSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'trima',
                            isIndicator: true,
                            parentSeriesID: trimaOptions.parentSeriesID,
                            period: trimaOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeTRIMA = function (uniqueID) {
                    var chart = this.chart;
                    trimaOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    trimaSeriesMap[uniqueID] = null;
                };

                H.Series.prototype.preRemovalCheckTRIMA = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        period : !trimaOptionsMap[uniqueID] ? undefined : trimaOptionsMap[uniqueID].period,
                        appliedTo : !trimaOptionsMap[uniqueID] ? undefined : trimaOptionsMap[uniqueID].appliedTo,
                        isValidUniqueID : trimaOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(trimaOptionsMap, this.options.id)) {
                        updateTRIMASeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(trimaOptionsMap, this.series.options.id)) {
                        updateTRIMASeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 */
                function updateTRIMASeries(time, isPointUpdate) {
                    //if this is TRIMA series, ignore
                    var series = this;
                    var chart = series.chart;

                    //Add a new TRIMA data point
                    for (var key in trimaSeriesMap) {
                        if (trimaSeriesMap[key] && trimaSeriesMap[key].options && trimaSeriesMap[key].options.data && trimaSeriesMap[key].options.data.length > 0
                            && trimaOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is TRIMA series. Add one more TRIMA point
                            //Calculate TRIMA data
                            /*
                               Formula ->
                                 MA = ( SMA ( SMAm, Nm ) ) / Nm

                                 Where:

                                 N = Time periods + 1
                                 Nm = Round ( N / 2 )
                                 SMAm = ( Sum ( Price, Nm ) ) / Nm
                             */
                            //Find the data point
                            var data = series.options.data;
                            var trimaData = trimaSeriesMap[key].options.data;
                            var trimaOptions = trimaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var maOptions = {
                                    data: data,
                                    maData: trimaData,
                                    index: dataPointIndex,
                                    period: trimaOptions.period,
                                    type: this.options.type,
                                    appliedTo: trimaOptions.appliedTo,
                                };
                                var maValue = indicatorBase.calculateTRIMAValue(maOptions);

                                if (isPointUpdate)
                                {
                                    trimaSeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(maValue, 4) });
                                }
                                else
                                {
                                    trimaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(maValue, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    }

});
