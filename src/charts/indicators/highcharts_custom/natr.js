/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var natrOptionsMap = {}, natrSeriesMap = {}, atr = {};

    function initATR(data, period) {
        var tr = [], atrData = [];
        for (var index = 0; index < data.length; index++) {

            //Calculate TR - start
            if (indicatorBase.isOHLCorCandlestick(this.options.type)) {
                if (index == 0) {
                    tr.push((data[index].high || data[index][2]) - (data[index].low || [index][3]));
                }
                else {
                    tr.push(
                        Math.max(Math.max((data[index].high || data[index][2]) - (data[index].low || data[index][3]), Math.abs((data[index].high || data[index][2]) - (data[index - 1].close || data[index - 1][4])))
                            , (data[index].low || data[index][3]) - (data[index - 1].close || data[index - 1][4])
                        )
                    );
                }
            }
            else {
                if (index == 0) {
                    //The close price is TR when index is 0
                    tr.push(data[index].y || data[index][1]);
                }
                else {
                    tr.push(Math.abs((data[index].y || data[index][1]) - (data[index - 1].y || data[index - 1][1])));
                }
            }
            //Calculate TR - end

            //Calculate ATR - start
            if (index >= period) {
                var natrValue = (atrData[index - 1][1] * (period - 1) + tr[index]) / period;
                if (isFinite(natrValue) && !isNaN(natrValue)) {
                    atrData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(natrValue, 4)]);
                }
            }
            else {
                atrData.push([(data[index].x || data[index][0]), 0]);
            }
            //Calculate ATR - end

        }
        return atrData;
    }

    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addNATR) return;

                H.Series.prototype.addNATR = function ( natrOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    natrOptions = $.extend({
                        period : 14,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        parentSeriesID : seriesID
                    }, natrOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add NATR series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate NATR data
                        /*
                          * Formula
                             NATR = ATR(n) / Close * 100
                             Where: ATR(n) = Average True Range over ‘n’ periods.
                         */
                        var natrData = [], atrData = initATR.call(this, data, natrOptions.period);
                        for (var index = 0; index < atrData.length; index++) {
                            var time = atrData[index][0];
                            var price = indicatorBase.extractPrice(data, index);
                            if (atrData[index][1]) {
                                natrData[index] = [time, indicatorBase.toFixed(atrData[index][1] / price * 100, 4) ];
                            } else {
                                natrData[index] = [time, null];
                            }
                        }
                        atr[uniqueID] = atrData;

                        var chart = this.chart;

                        natrOptionsMap[uniqueID] = natrOptions;

                        chart.addAxis({ // Secondary yAxis
                            id: 'natr'+ uniqueID,
                            title: {
                                text: 'NATR (' + natrOptions.period  + ')',
                                align: 'high',
                                offset: 0,
                                rotation: 0,
                                y: 10, //Trying to show title inside the indicator chart
                                x: 50
                            },
                            lineWidth: 2,
                            plotLines: natrOptions.levels
                        }, false, false, false);

                        indicatorBase.recalculate(chart);

                        var series = this;
                        natrSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'NATR (' + natrOptions.period  + ')',
                            data: natrData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            yAxis: 'natr'+ uniqueID,
                            opposite: series.options.opposite,
                            color: natrOptions.stroke,
                            lineWidth: natrOptions.strokeWidth,
                            dashStyle: natrOptions.dashStyle
                        }, false, false);

                        $(natrSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'natr',
                            parentSeriesID: natrOptions.parentSeriesID,
                            period: natrOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();
                        //console.log('series.options.length : ', this.options.data.length);
                        //console.log('natrSeriesMap.options.data.length : ', natrSeriesMap[uniqueID].options.data.length);

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeNATR = function (uniqueID) {
                    var chart = this.chart;
                    natrOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    chart.get('natr' + uniqueID).remove(false);
                    natrSeriesMap[uniqueID] = null;
                    atr[uniqueID] = [];
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckNATR = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        period : !natrOptionsMap[uniqueID] ? undefined : natrOptionsMap[uniqueID].period,
                        isValidUniqueID : natrOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(natrOptionsMap, this.options.id))
                    {
                        updateNATRSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(natrOptionsMap, this.series.options.id))
                    {
                        updateNATRSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateNATRSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new NATR data point
                    for (var key in natrSeriesMap) {
                        if (natrSeriesMap[key] && natrSeriesMap[key].options && natrSeriesMap[key].options.data
                                            && natrSeriesMap[key].options.data.length > 0
                                            && natrOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is NATR series. Add one more NATR point
                            //Calculate NATR data
                            /*
                               * Formula
                                 NATR = ATR(n) / Close * 100
                                 Where: ATR(n) = Average True Range over ‘n’ periods.
                             */
                            //Find the data point
                            var data = series.options.data;
                            var natrData = natrSeriesMap[key].options.data;
                            var n = natrOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                var tr = 0.0;
                                if (indicatorBase.isOHLCorCandlestick(series.options.type)) {
                                    var highValue = (data[dataPointIndex].high || data[dataPointIndex][2]);
                                    var lowValue = (data[dataPointIndex].low || data[dataPointIndex][3]);
                                    var closeValue = (data[dataPointIndex - 1].close || data[dataPointIndex - 1][4]);
                                    tr = Math.max(Math.max(highValue - lowValue, Math.abs(highValue - closeValue)), (lowValue - closeValue));
                                }
                                else {
                                    var priceNow = (data[dataPointIndex].y || data[dataPointIndex][1]);
                                    var pricePrev = (data[dataPointIndex - 1].y || data[dataPointIndex - 1][1]);
                                    tr = Math.abs(priceNow - pricePrev);
                                }

                                var price = indicatorBase.extractPrice(data, dataPointIndex);
                                var atrVal = indicatorBase.toFixed(( atr[key][dataPointIndex - 1][1] * (n - 1) + tr ) / n, 4) ;
                                var natr = indicatorBase.toFixed(atrVal /  price * 100, 4);
                                if (!$.isNumeric(natr)) continue;

                                var time = (data[dataPointIndex].x || data[dataPointIndex][0]);
                                if (isPointUpdate)
                                {
                                    atr[key][dataPointIndex] = [time, atrVal];
                                    natrSeriesMap[key].data[dataPointIndex].update({ y : natr});
                                }
                                else
                                {
                                    //console.log('series.options.data.length : ', data.length);
                                    //console.log('natrSeries.options.data.length (before) : ', natrSeriesMap[key].options.data.length);
                                    atr[key].push([time, atrVal]);
                                    natrSeriesMap[key].addPoint([time, natr], true, true, false);
                                    //console.log('natrSeries.options.data.length (after) : ', natrSeriesMap[key].options.data.length);
                                }
                            }
                        }
                    }
                }

            } (Highcharts,jQuery,indicatorBase));

        }
    }

});
