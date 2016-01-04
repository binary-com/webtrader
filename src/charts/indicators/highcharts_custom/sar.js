/**
 * Created by Mahbobeh on 12/9/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var sarOptionsMap = {}, sarSeriesMap = {};
    var epArray = {}, afArray = {}, sarArray = {}, trendArray = {};

    //******************************Get Price*************************
    function calculateSarValue(data, index, sarOptions, key, isPointUpdate) {
        var ep = epArray[key], af = afArray[key], sar = sarArray[key], trend = trendArray[key];
        var highPrice = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, index);
        var lowPrice = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, index);

        var currentSar = 0.0;
        if (trend[index - 2] === trend[index - 1]) {
            var prevSarPlusDeltaAF = (sar[index - 1] + (af[index - 1] * (ep[index - 1] - sar[index - 1])));
            if (trend[index - 1] === "UP") {
                var lowMin = Math.min(indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, index - 1), indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, index - 2));
                if ((prevSarPlusDeltaAF) < lowMin) {
                    currentSar = prevSarPlusDeltaAF;
                } else {
                    currentSar = lowMin;
                }
            } else {
                var highMax = Math.max(indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, index - 1), indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, index - 2));
                if ((prevSarPlusDeltaAF) > highMax) {
                    currentSar = highMax;
                } else {
                    currentSar = prevSarPlusDeltaAF;
                }
            }
        } else {
            currentSar = ep[index - 1];
        }
        if (isPointUpdate) {
            sar[index] = currentSar;
        }
        else {
            sar.push(currentSar);
        }

        var epValue = trend[index - 1] === "UP" ?
            (highPrice > ep[index - 1] ? highPrice : ep[index - 1])
            : (lowPrice < ep[index - 1] ? lowPrice : ep[index - 1]);
        if (isPointUpdate) {
            ep[index] = epValue;
        }
        else {
            ep.push(epValue);
        }

        var trendDirection = '';
        if (trend[index - 1] === "UP") {
            if (lowPrice > currentSar) {
                trendDirection = 'UP';
            } else {
                trendDirection = 'DOWN';
            }
        } else if (trend[index - 1] === "DOWN") {
            if (highPrice < currentSar) {
                trendDirection = 'DOWN';
            } else {
                trendDirection = 'UP';
            }
        }
        if (isPointUpdate) {
            trend[index] = trendDirection;
        }
        else {
            trend.push(trendDirection);
        }

        var afValue = 0.0;
        if (trend[index] === trend[index - 1]) {
            if (trend[index] === "UP") {
                //if (ep[index] > ep[index - 1]) {
                    if (af[index - 1] === sarOptions.maximum) {
                        afValue = af[index - 1];
                    } else {
                        afValue = sarOptions.maximum;
                    }
                //} else {
                //    if (ep[index] < ep[index - 1]) {
                //        if (af[index - 1] === sarOptions.maximum) {
                //            afValue = af[index - 1];
                //        } else {
                //            afValue = sarOptions.maximum;
                //        }
                    //}
                //}
            } else {
                afValue = af[index - 1];
            }
        } else {
            afValue = sarOptions.acceleration;
        }
        if (isPointUpdate) {
            af[index] = afValue;
        }
        else {
            af.push(afValue);
        }

        return currentSar;
    }

    return {
        init: function () {

            (function (H, $, indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addSAR) return;

                H.Series.prototype.addSAR = function (sarOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    sarOptions = $.extend({
                        acceleration: 0.02,
                        maximum: 0.2,
                        stroke: 'red',
                        strokeWidth: 2,
                        dashStyle: 'line',
                        levels: [],
                        parentSeriesID: seriesID
                    }, sarOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add sar series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {
                        //Calculate SAR data
                        var period = 5;
                        //Trend Direction :
                        // Up=0
                        //Down=1
                        var sarData = [];
                        var ep = [], af = [], sar = [], trend = [];
                        epArray[uniqueID] = ep;
                        afArray[uniqueID] = af;
                        sarArray[uniqueID] = sar;
                        trendArray[uniqueID] = trend;
                        for (var index = 0; index < data.length; index++) {
                            var highPrice = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, index);
                            var lowPrice = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, index);
                            if (index < period) {
                                sarData.push([(data[index].x || data[index][0]), 0]);
                                sar.push(0);
                                ep.push(0);
                                af.push(sar.acceleration);
                                if (index === (period - 1)) {
                                    trend.push('UP');
                                } else {
                                    trend.push("");
                                }
                            }
                            else if (index == period) {
                                var sarValue = 0.0, epValue = 0.0;
                                for (var i = 0; i < period; i++) {
                                    var highPrice = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, index);
                                    var lowPrice = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, index);

                                    if (sarValue === 0.0) {
                                        //value init so that Math.min works properly
                                        sarValue = highPrice;
                                    }
                                    sarValue = Math.min(sarValue, lowPrice, highPrice);
                                    epValue = Math.max(sarValue, lowPrice, highPrice);
                                }
                                sar.push(sarValue);
                                ep.push(epValue);

                                af.push(sarOptions.acceleration);

                                var trendDirection = 'UP';
                                if (trend[index - 1] === 'UP') {
                                    if (lowPrice > sarValue) {
                                        trendDirection = 'UP';
                                    } else {
                                        trendDirection = 'DOWN';
                                    }
                                } else if (trend[index - 1] === 'DOWN') {
                                    if (highPrice < sarValue) {
                                        trendDirection = 'DOWN';
                                    } else {
                                        trendDirection = 'UP';
                                    }
                                }
                                trend.push(trendDirection);

                                sarData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(sarValue, 4)]);
                            }
                            else {
                                var sarValue = calculateSarValue(data, index, sarOptions, uniqueID, false);
                                sarData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(sarValue, 4)]);
                            }
                        }


                        var chart = this.chart;

                        sarOptionsMap[uniqueID] = sarOptions;

                        var series = this;
                        sarSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'SAR (' + sarOptions.acceleration + "," + sarOptions.maximum + ')',
                            data: sarData,
                            // type: 'scatter',
                            lineWidth: 0,
                            marker: {
                                enabled: true,
                                // radius : sarOptions.strokeWidth
                            },
                            dataGrouping: series.options.dataGrouping,
                            // yAxis: 'sar'+ uniqueID,
                            opposite: series.options.opposite,
                            color: sarOptions.stroke,
                            //lineWidth: sarOptions.strokeWidth,
                            //dashStyle: sarOptions.dashStyle
                            states: {
                                hover: {
                                    enabled: false
                                }
                            }
                        }, false, false);

                        $(sarSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'sar',
                            parentSeriesID: sarOptions.parentSeriesID,
                            period: sarOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeSAR = function (uniqueID) {
                    var chart = this.chart;
                    sarOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    sarSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckSAR = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        acceleration : !sarOptionsMap[uniqueID] ? undefined : sarOptionsMap[uniqueID].acceleration,
                        maximum : !sarOptionsMap[uniqueID] ? undefined : sarOptionsMap[uniqueID].maximum,
                        isValidUniqueID : sarOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(sarOptionsMap, this.options.id)) {
                        updatesarSeries.call(this, options[0], false);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(sarOptionsMap, this.series.options.id)) {
                        updatesarSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updatesarSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new sar data point
                    for (var key in sarSeriesMap) {
                        if (sarSeriesMap[key] && sarSeriesMap[key].options && sarSeriesMap[key].options.data && sarSeriesMap[key].options.data.length > 0
                            && sarOptionsMap[key].parentSeriesID == series.options.id
                            && sarSeriesMap[key].chart === chart
                        ) {
                            //This is sar series. Add one more sar point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            var sarOptions = sarOptionsMap[key];
                            if (dataPointIndex >= 1) {

                                var sarValue = calculateSarValue(data, dataPointIndex, sarOptions, key, isPointUpdate);

                                if (isPointUpdate) {
                                    console.log('SAR value : ', sarValue);
                                    sarSeriesMap[key].data[dataPointIndex].update({ y : indicatorBase.toFixed(sarValue, 4)});
                                }
                                else {
                                    sarSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(sarValue, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    }

});