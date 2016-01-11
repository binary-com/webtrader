/**
 * Created by Mahboob.M on 1/7/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlmatholdOptionsMap = {}, cdlmatholdSeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index -2;
        var candleFor_Index = index - 3;
        var candleFive_Index = index - 4;

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
            candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index);

        var candleFor_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFor_Index),
            candleFor_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFor_Index);

        var candleFive_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFive_Index),
            candleFive_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFive_Index);


        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
           isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
           isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleFor_Bullish = candleFor_Close > candleFor_Open,
           isCandleFor_Bearish = candleFor_Close < candleFor_Open;
        var isCandleFive_Bullish = candleFive_Close > candleFive_Open,
           isCandleFive_Bearish = candleFive_Close < candleFive_Open;

        var isBullishContinuation = isCandleFive_Bullish && (Math.abs(candleFive_Close - candleFive_Open) > candleMediumHeight)  //The first day is a long white day
                                    && isCandleFor_Bearish && (candleFor_Close > candleFive_Close) && (Math.abs(candleFor_Close-candleFor_Open) < candleMediumHeight)//The second day gaps up and is a black day
                                    && isCandleThree_Bearish && (candleThree_Close < candleFor_Close) && (Math.abs(candleThree_Close - candleThree_Open) < candleMediumHeight)//The second, third, and fourth days have small real bodies and follow a brief downtrend pattern, but stay within the range of the first day 
                                    && isCandleTwo_Bearish && (candleTwo_Close < candleThree_Close) && (Math.abs(candleTwo_Close - candleTwo_Open) < candleMediumHeight) && (candleTwo_Close > candleFive_Open) //  stay within the range of the first day 
                                    && isCandleOne_Bullish && (Math.abs(candleOne_Close - candleOne_Open) > candleMediumHeight) && (candleOne_Close > candleFor_Close);// The fifth day is a long white day that closes above the trading ranges of the previous four days

        var isBearishContinuation = isCandleFive_Bearish && (Math.abs(candleFive_Close - candleFive_Open) > candleMediumHeight)  //The first day is a long red day
                                    && isCandleFor_Bullish && (candleFor_Close < candleFive_Close) && (Math.abs(candleFor_Close - candleFor_Open) < candleMediumHeight)//The second day gaps up and is a black day
                                    && isCandleThree_Bullish && (candleThree_Close > candleFor_Close) && (Math.abs(candleThree_Close - candleThree_Open) < candleMediumHeight)//The second, third, and fourth days have small real bodies and follow a brief downtrend pattern, but stay within the range of the first day 
                                    && isCandleTwo_Bullish && (candleTwo_Close > candleThree_Close) && (Math.abs(candleTwo_Close - candleTwo_Open) < candleMediumHeight) && (candleTwo_Close < candleFive_Open) //  stay within the range of the first day 
                                    && isCandleOne_Bearish && (Math.abs(candleOne_Close - candleOne_Open) > candleMediumHeight) && (candleOne_Close < candleFor_Close);// The fifth day is a long white day that closes bellow  the trading ranges of the previous four days

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
                if (!H || H.Series.prototype.addCDLMATHOLD) return;

                H.Series.prototype.addCDLMATHOLD = function (cdlmatholdOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlmatholdOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlmatholdOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLMATHOLD series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLMATHOLD data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlmatholdData = [];
                        for (var index = 4 ; index < data.length; index++) {

                            //Calculate CDLMATHOLD - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlmatholdData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">MH</span>',
                                    text: 'Mat Hold : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlmatholdData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">MH</span>',
                                    text: 'Mat Hold : Bear'
                                });
                            }
                            //Calculate CDLMATHOLD - end
                        };

                        var chart = this.chart;

                        cdlmatholdOptionsMap[uniqueID] = cdlmatholdOptions;

                        var series = this;
                        cdlmatholdSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLMATHOLD',
                            data: cdlmatholdData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlmatholdSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlmathold',
                            parentSeriesID: cdlmatholdOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLMATHOLD = function (uniqueID) {
                    var chart = this.chart;
                    cdlmatholdOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlmatholdSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLMATHOLD = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlmatholdOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlmatholdeed, options, redraw, shift, animation) {

                    pcdlmatholdeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlmatholdOptionsMap, this.options.id)) {
                        updateCDLMATHOLDSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlmatholdeed, options, redraw, animation) {

                    pcdlmatholdeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlmatholdOptionsMap, this.series.options.id)) {
                        updateCDLMATHOLDSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLMATHOLDSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLMATHOLD data point
                    for (var key in cdlmatholdSeriesMap) {
                        if (cdlmatholdSeriesMap[key] && cdlmatholdSeriesMap[key].options && cdlmatholdSeriesMap[key].options.data && cdlmatholdSeriesMap[key].options.data.length > 0
                            && cdlmatholdOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLMATHOLD series. Add one more CDLMATHOLD point
                            //Calculate CDLTAKURI data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLMATHOLD - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLMATHOLD - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">MH</span>',
                                        text: 'Mat Hold : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">MH</span>',
                                        text: 'Mat Hold : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlmatholdSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlmatholdSeriesMap[key].data[sIndx].x || cdlmatholdSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlmatholdSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlmatholdSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlmatholdSeriesMap[key].data[whereToUpdate].remove();
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
