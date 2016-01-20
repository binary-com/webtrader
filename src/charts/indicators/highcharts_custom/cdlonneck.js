/**
 * Created by Mahboob.M on 1/5/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlonneckOptionsMap = {}, cdlonneckSeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
            candleTwo_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleTwo_Index),
            candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index);

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index);

        var isCandleThree_Bearish = candleThree_Close < candleThree_Open,
            isCandleThree_Bullish = candleThree_Close > candleThree_Open;

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
            isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var candleTwoBodySize = Math.abs(candleTwo_Close - candleTwo_Open);

        var isBullishContinuation = isCandleThree_Bullish //After an uptrend
                                    && isCandleTwo_Bullish && candleTwoBodySize > candleMediumHeight //1st day is a long blue day.
                                    && isCandleOne_Bearish && candleOne_Open > candleTwo_High  //2nd day is a red day which opens above the high of the 1st day
                                    && candleOne_Close >= candleTwo_High && candleOne_Close <= (candleTwo_High + (candleTwoBodySize * 0.10));//The closing price of the black candle is at or near the high of the white candle

        var isBearishContinuation = isCandleThree_Bearish //After a downtrend
                                    && isCandleTwo_Bearish && candleTwoBodySize > candleMediumHeight //1st day is a long red day.
                                    && isCandleOne_Bullish && candleOne_Open < candleTwo_Low  //2nd day is a white day which opens below the low of the 1st day
                                    && candleOne_Close <= candleTwo_Low && candleOne_Close >= (candleTwo_Low - (candleTwoBodySize * 0.10));//The closing price of the white candle is at or near the low of the black candle
        return {
            isBullishContinuation: isBullishContinuation,
            isBearishContinuation: isBearishContinuation
        };
    }

    return {
        init: function () {

            (function (H, $, indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addCDLONNECK) return;

                H.Series.prototype.addCDLONNECK = function (cdlonneckOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlonneckOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlonneckOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLONNECK series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLONNECK data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlonneckData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLONNECK - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            if (bull_bear.isBullishContinuation) {
                                cdlonneckData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">ON</span>',
                                    text: 'On-Neck : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlonneckData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">ON</span>',
                                    text: 'On-Neck : Bear'
                                });
                            }
                            //Calculate CDLONNECK - end
                        };

                        var chart = this.chart;

                        cdlonneckOptionsMap[uniqueID] = cdlonneckOptions;

                        var series = this;
                        cdlonneckSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLONNECK',
                            data: cdlonneckData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlonneckSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlonneck',
                            parentSeriesID: cdlonneckOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLONNECK = function (uniqueID) {
                    var chart = this.chart;
                    cdlonneckOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlonneckSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLONNECK = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlonneckOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlonneckeed, options, redraw, shift, animation) {

                    pcdlonneckeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlonneckOptionsMap, this.options.id)) {
                        updateCDLONNECKSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlonneckeed, options, redraw, animation) {

                    pcdlonneckeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlonneckOptionsMap, this.series.options.id)) {
                        updateCDLONNECKSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLONNECKSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLONNECK data point
                    for (var key in cdlonneckSeriesMap) {
                        if (cdlonneckSeriesMap[key] && cdlonneckSeriesMap[key].options && cdlonneckSeriesMap[key].options.data && cdlonneckSeriesMap[key].options.data.length > 0
                            && cdlonneckOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLONNECK series. Add one more CDLONNECK point
                            //Calculate CDLONNECK data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLONNECK - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLONNECK - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">ON</span>',
                                        text: 'On-Neck : Bull'
                                    }
                                } else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">ON</span>',
                                        text: 'On-Neck : Bear'
                                    }
                                }
                                //Calculate CDLONNECK - end


                                var whereToUpdate = -1;
                                for (var sIndx = cdlonneckSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlonneckSeriesMap[key].data[sIndx].x || cdlonneckSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlonneckSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlonneckSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlonneckSeriesMap[key].data[whereToUpdate].remove();
                                    }
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    }

});
