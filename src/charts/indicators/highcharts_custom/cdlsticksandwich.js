/**
 * Created by Mahboob.M on 1/7/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlsticksandwichOptionsMap = {}, cdlsticksandwichSeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;
        var candleFor_Index = index - 3;

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
            candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index);

        var candleFor_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFor_Index),
            candleFor_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFor_Index);


        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
           isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
           isCandleThree_Bearish = candleThree_Close < candleThree_Open;
         
        var candleThreebodySize=Math.abs(candleThree_Close-candleThree_Open);
        var isCanldeOneCloseSameAsCandleThreeClose = (candleOne_Close === candleThree_Close)
                                          || (candleOne_Close <= (candleThree_Close + (candleThreebodySize * 0.05)))
                                          || (candleOne_Close >= (candleThree_Close - (candleThreebodySize * 0.05)));

        var isBullishContinuation = isCandleThree_Bearish && (Math.abs(candleThree_Close - candleThree_Open) > candleMediumHeight) && (candleThree_Close < (Math.min(candleFor_Close,candleFor_Open))) //We see a black candlestick on the first day after a downtrend
                                    && isCandleTwo_Bullish && (candleTwo_Close > candleThree_Open) && (candleTwo_Open > candleThree_Close) && (candleTwo_Open < candleThree_Open) //The second candlestick is a white (green) candlestick that gaps up from the previous close and closes above the previous day's open
                                    && isCandleOne_Bearish && (candleOne_Open > candleTwo_Close) && (candleOne_Close < candleTwo_Open) //both of which will have a larger trading range than the middle candlestick.
                                    && (Math.abs(candleOne_Close - candleOne_Open) > candleMediumHeight) && isCanldeOneCloseSameAsCandleThreeClose;//The third day is a black day that closes at or near the close of the first day.

        var isBearishContinuation = isCandleThree_Bullish && (Math.abs(candleThree_Close - candleThree_Open) > candleMediumHeight) && (candleThree_Close > (Math.max(candleFor_Close,candleFor_Open))) //We see a white candlestick on the first day after an uptrend
                                    && isCandleTwo_Bearish && (candleTwo_Close < candleThree_Open) && (candleTwo_Open < candleThree_Close) && (candleTwo_Open > candleThree_Open)//The second candlestick is a black candlestick that gaps down from the previous close and closes bellow the previous day's open
                                    && isCandleOne_Bullish && (candleOne_Open < candleTwo_Close) && (candleOne_Close > candleTwo_Open) //both of which will have a larger trading range than the middle candlestick.
                                    && (Math.abs(candleOne_Close - candleOne_Open) > candleMediumHeight) &&  isCanldeOneCloseSameAsCandleThreeClose;//The third day is a black day that closes at or near the close of the first day.

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
                if (!H || H.Series.prototype.addCDLSTICKSANDWICH) return;

                H.Series.prototype.addCDLSTICKSANDWICH = function (cdlsticksandwichOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlsticksandwichOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlsticksandwichOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLSTICKSANDWICH series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLSTICKSANDWICH data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlsticksandwichData = [];
                        for (var index = 3 ; index < data.length; index++) {

                            //Calculate CDLSTICKSANDWICH - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlsticksandwichData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">SS</span>',
                                    text: 'Stick Sandwich : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlsticksandwichData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">SS</span>',
                                    text: 'Stick Sandwich : Bear'
                                });
                            }
                            //Calculate CDLSTICKSANDWICH - end
                        };

                        var chart = this.chart;

                        cdlsticksandwichOptionsMap[uniqueID] = cdlsticksandwichOptions;

                        var series = this;
                        cdlsticksandwichSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLSTICKSANDWICH',
                            data: cdlsticksandwichData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlsticksandwichSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlsticksandwich',
                            parentSeriesID: cdlsticksandwichOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLSTICKSANDWICH = function (uniqueID) {
                    var chart = this.chart;
                    cdlsticksandwichOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlsticksandwichSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLSTICKSANDWICH = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlsticksandwichOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlsticksandwicheed, options, redraw, shift, animation) {

                    pcdlsticksandwicheed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlsticksandwichOptionsMap, this.options.id)) {
                        updateCDLSTICKSANDWICHSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlsticksandwicheed, options, redraw, animation) {

                    pcdlsticksandwicheed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlsticksandwichOptionsMap, this.series.options.id)) {
                        updateCDLSTICKSANDWICHSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLSTICKSANDWICHSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLSTICKSANDWICH data point
                    for (var key in cdlsticksandwichSeriesMap) {
                        if (cdlsticksandwichSeriesMap[key] && cdlsticksandwichSeriesMap[key].options && cdlsticksandwichSeriesMap[key].options.data && cdlsticksandwichSeriesMap[key].options.data.length > 0
                            && cdlsticksandwichOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLSTICKSANDWICH series. Add one more CDLSTICKSANDWICH point
                            //Calculate CDLTAKURI data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLSTICKSANDWICH - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLSTICKSANDWICH - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">SS</span>',
                                        text: 'Stick Sandwich : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">SS</span>',
                                        text: 'Stick Sandwich : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlsticksandwichSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlsticksandwichSeriesMap[key].data[sIndx].x || cdlsticksandwichSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlsticksandwichSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlsticksandwichSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlsticksandwichSeriesMap[key].data[whereToUpdate].remove();
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
