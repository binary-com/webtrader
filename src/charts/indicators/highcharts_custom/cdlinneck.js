/**
 * Created by Mahboob.M on 1/5/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlinneckOptionsMap = {}, cdlinneckSeriesMap = {};
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
                                    && candleOne_Close < candleTwo_Close && candleOne_Close > (candleTwo_Close - (candleTwoBodySize * 0.10));//2nd day closes barely into the body of the 1st day,near 1st day close.

        var isBearishContinuation = isCandleThree_Bearish //After a downtrend
                                    && isCandleTwo_Bearish && candleTwoBodySize > candleMediumHeight //1st day is a long red day.
                                    && isCandleOne_Bullish && candleOne_Open < candleTwo_Low  //2nd day is a white day which opens below the low of the 1st day
                                    && candleOne_Close > candleTwo_Close && candleOne_Close < (candleTwo_Close + (candleTwoBodySize * 0.10));//2nd day closes barely into the body of the 1st day,near 1st day close.
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
                if (!H || H.Series.prototype.addCDLINNECK) return;

                H.Series.prototype.addCDLINNECK = function (cdlinneckOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlinneckOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlinneckOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLINNECK series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLINNECK data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlinneckData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLINNECK - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            if (bull_bear.isBullishContinuation) {
                                cdlinneckData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">IN</span>',
                                    text: 'In-Neck : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlinneckData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">IN</span>',
                                    text: 'In-Neck : Bear'
                                });
                            }
                            //Calculate CDLINNECK - end
                        };

                        var chart = this.chart;

                        cdlinneckOptionsMap[uniqueID] = cdlinneckOptions;

                        var series = this;
                        cdlinneckSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLINNECK',
                            data: cdlinneckData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlinneckSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlinneck',
                            parentSeriesID: cdlinneckOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLINNECK = function (uniqueID) {
                    var chart = this.chart;
                    cdlinneckOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlinneckSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLINNECK = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlinneckOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlinneckeed, options, redraw, shift, animation) {

                    pcdlinneckeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlinneckOptionsMap, this.options.id)) {
                        updateCDLINNECKSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlinneckeed, options, redraw, animation) {

                    pcdlinneckeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlinneckOptionsMap, this.series.options.id)) {
                        updateCDLINNECKSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLINNECKSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLINNECK data point
                    for (var key in cdlinneckSeriesMap) {
                        if (cdlinneckSeriesMap[key] && cdlinneckSeriesMap[key].options && cdlinneckSeriesMap[key].options.data && cdlinneckSeriesMap[key].options.data.length > 0
                            && cdlinneckOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLINNECK series. Add one more CDLINNECK point
                            //Calculate CDLINNECK data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLINNECK - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLINNECK - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">IN</span>',
                                        text: 'In-Neck : Bull'
                                    }
                                } else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">IN</span>',
                                        text: 'In-Neck : Bear'
                                    }
                                }
                                //Calculate CDLINNECK - end


                                var whereToUpdate = -1;
                                for (var sIndx = cdlinneckSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlinneckSeriesMap[key].data[sIndx].x || cdlinneckSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlinneckSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlinneckSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlinneckSeriesMap[key].data[whereToUpdate].remove();
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
