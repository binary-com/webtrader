/**
 * Created by Mahboob.M on 12/20/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var kamaOptionsMap = {}, kamaSeriesMap = {};
    var kama1 = {}, kama2 = {};

    //*************************KAMA*****************************************
    function calculateKAMAValue(data, kamaData, index, period, fastPeriod, slowPeriod, type, appliedTo) {

        //Calculate KAMA data
        //Change = ABS(Close - Close (10 periods ago))
        //Volatility = Sum10(ABS(Close - Prior Close))
        //ER = Change/Volatility
        //fastest SC = 2/(fastest + 1);
        //slowest SC = 2/(slowest + 1);
        //SC = [ER x (fastest SC - slowest SC) + slowest SC]2
        //Current KAMA = Prior KAMA + SC * (Price - Prior KAMA)
        if (index < period - 1)
            return null;
        else if (index == period - 1)
            return indicatorBase.getPrice(data, index, appliedTo, type);
        else {
            var fastestSC = 2 / (fastPeriod + 1);
            var slowestSC = 2 / (slowPeriod + 1);
            //Change = ABS(Close - Close (10 periods ago))
            var change = Math.abs(indicatorBase.getPrice(data, index, appliedTo, type) - indicatorBase.getPrice(data, index - period, appliedTo, type));
            var sum = 0.0;
            for (var i = 0; i < period; i++) {
                //Volatility = Sum10(ABS(Close - Prior Close))
                sum += Math.abs(indicatorBase.getPrice(data, index - i, appliedTo, type) - indicatorBase.getPrice(data, index - (i + 1), appliedTo, type));
            }
            var er = change / sum;
            var sc = Math.pow((er * (fastestSC - slowestSC) + slowestSC), 2);
            var price = indicatorBase.getPrice(data, index, appliedTo, type);
            var preKama = typeof kamaData[index - 1] === "number" ? kamaData[index - 1] : (kamaData[index - 1][1] || kamaData[index - 1].y);
            return preKama + sc * (price - preKama);
        }
    };

    return {
        init: function () {

            (function (H, $, indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addKAMA) return;

                H.Series.prototype.addKAMA = function (kamaOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    kamaOptions = $.extend({
                        period: 21,
                        fastPeriod: 2,
                        slowPeriod: 30,
                        stroke: 'red',
                        strokeWidth: 2,
                        dashStyle: 'line',
                        levels: [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID: seriesID
                    }, kamaOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ATR series to the chart
                    var data = this.options.data || [];
                    //If period is higher than data.length, we cannot calculate kama. Return from here
                    if (kamaOptions.period >= data.length) return;

                    if (data && data.length > 0) {

                        //Calculate KAMA data
                        //Change = ABS(Close - Close (10 periods ago))
                        //Volatility = Sum10(ABS(Close - Prior Close))
                        //ER = Change/Volatility
                        //fastest SC = 2/(fastest + 1);
                        //slowest SC = 2/(slowest + 1);
                        //SC = [ER x (fastest SC - slowest SC) + slowest SC]2
                        //Current KAMA = Prior KAMA + SC * (Price - Prior KAMA)

                        var kamaData = [];
                        for (var index = 0; index < data.length; index++) {
                            var maValue = calculateKAMAValue(data, kamaData, index, kamaOptions.period, kamaOptions.fastPeriod, kamaOptions.slowPeriod, this.options.type, kamaOptions.appliedTo);
                            kamaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(maValue, 4)]);
                        }


                        var chart = this.chart;

                        kamaOptionsMap[uniqueID] = kamaOptions;

                        var series = this;
                        kamaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'KAMA (' + kamaOptions.period + ', ' + indicatorBase.appliedPriceString(kamaOptions.appliedTo) + ')',
                            data: kamaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: kamaOptions.stroke,
                            lineWidth: kamaOptions.strokeWidth,
                            dashStyle: kamaOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(kamaSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'kama',
                            isIndicator: true,
                            parentSeriesID: kamaOptions.parentSeriesID,
                            period: kamaOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeKAMA = function (uniqueID) {
                    var chart = this.chart;
                    kamaOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    kamaSeriesMap[uniqueID] = null;
                };

                H.Series.prototype.preRemovalCheckKAMA = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        period: !kamaOptionsMap[uniqueID] ? undefined : kamaOptionsMap[uniqueID].period,
                        appliedTo: !kamaOptionsMap[uniqueID] ? undefined : kamaOptionsMap[uniqueID].appliedTo,
                        isValidUniqueID: kamaOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(kamaOptionsMap, this.options.id)) {
                        updateKAMASeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(kamaOptionsMap, this.series.options.id)) {
                        updateKAMASeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 */
                function updateKAMASeries(time, isPointUpdate) {
                    //if this is KAMA series, ignore
                    var series = this;
                    var chart = series.chart;

                    //Add a new KAMA data point
                    for (var key in kamaSeriesMap) {
                        if (kamaSeriesMap[key] && kamaSeriesMap[key].options && kamaSeriesMap[key].options.data && kamaSeriesMap[key].options.data.length > 0
                            && kamaOptionsMap[key].parentSeriesID == series.options.id) {
                            //Calculate KAMA data
                            //Change = ABS(Close - Close (10 periods ago))
                            //Volatility = Sum10(ABS(Close - Prior Close))
                            //ER = Change/Volatility
                            //fastest SC = 2/(fastest + 1);
                            //slowest SC = 2/(slowest + 1);
                            //SC = [ER x (fastest SC - slowest SC) + slowest SC]2
                            //Current KAMA = Prior KAMA + SC * (Price - Prior KAMA)

                            //Find the data point
                            var data = series.options.data;
                            var kamaData = kamaSeriesMap[key].options.data;
                            var kamaOptions = kamaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var kamaValue =  calculateKAMAValue(data, kamaData, dataPointIndex, kamaOptions.period, kamaOptions.fastPeriod, kamaOptions.slowPeriod, this.options.type, kamaOptions.appliedTo);

                                if (isPointUpdate) {
                                    kamaSeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(kamaValue, 4) });
                                }
                                else {
                                    kamaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(kamaValue, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    }

});
