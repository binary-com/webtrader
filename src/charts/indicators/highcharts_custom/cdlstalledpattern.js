/**
 * Created by Mahboob.M on 12/30/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlstalledpatternOptionsMap = {}, cdlstalledpatternSeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
			isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var candleThreeBodySize = Math.abs(candleThree_Close - candleThree_Open),
            candleTwoBodySize = Math.abs(candleTwo_Close - candleTwo_Open),
            candleOneBodySize = Math.abs(candleOne_Close - candleOne_Open);


        var isBullishContinuation = isCandleThree_Bearish && (candleThreeBodySize > candleMediumHeight)// three candlesticks in a downtrend
                                   && isCandleTwo_Bearish && (candleTwoBodySize > candleMediumHeight) && (candleTwo_Open <= candleThree_Open) //The second candlestick must open close to the close of the previous day. 
                                   && isCandleOne_Bearish && (candleOne_Open < candleTwo_Close)   //must open close to the close of the previous day.
                                   && (candleOneBodySize < candleMediumHeight * 0.60); //the last candlestick must be short

        var isBearishContinuation = isCandleThree_Bullish && (candleThreeBodySize > candleMediumHeight) // three candlesticks in a downtrend
                                   && isCandleTwo_Bullish && (candleTwoBodySize > candleMediumHeight) && (candleTwo_Open >= candleThree_Open) //The second candlestick must open close to the close of the previous day. 
                                   && isCandleOne_Bullish && (candleOne_Open > candleTwo_Close)   //must open close to the close of the previous day.
                                   && (candleOneBodySize < candleMediumHeight * 0.60); //the last candlestick must be short


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
                if (!H || H.Series.prototype.addCDLSTALLEDPATTERN) return;

                H.Series.prototype.addCDLSTALLEDPATTERN = function (cdlstalledpatternOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlstalledpatternOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlstalledpatternOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLSTALLEDPATTERN series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLSTALLEDPATTERN data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlstalledpatternData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLSTALLEDPATTERN - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlstalledpatternData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">SP</span>',
                                    text: 'Stalled Pattern : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlstalledpatternData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">SP</span>',
                                    text: 'Stalled Pattern  : Bear'
                                });
                            }
                            //Calculate CDLSTALLEDPATTERN - end
                        };

                        var chart = this.chart;

                        cdlstalledpatternOptionsMap[uniqueID] = cdlstalledpatternOptions;

                        var series = this;
                        cdlstalledpatternSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLSTALLEDPATTERN',
                            data: cdlstalledpatternData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlstalledpatternSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlstalledpattern',
                            parentSeriesID: cdlstalledpatternOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLSTALLEDPATTERN = function (uniqueID) {
                    var chart = this.chart;
                    cdlstalledpatternOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlstalledpatternSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLSTALLEDPATTERN = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlstalledpatternOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlstalledpatterneed, options, redraw, shift, animation) {

                    pcdlstalledpatterneed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlstalledpatternOptionsMap, this.options.id)) {
                        updateCDLSTALLEDPATTERNSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlstalledpatterneed, options, redraw, animation) {

                    pcdlstalledpatterneed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlstalledpatternOptionsMap, this.series.options.id)) {
                        updateCDLSTALLEDPATTERNSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLSTALLEDPATTERNSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLSTALLEDPATTERN data point
                    for (var key in cdlstalledpatternSeriesMap) {
                        if (cdlstalledpatternSeriesMap[key] && cdlstalledpatternSeriesMap[key].options && cdlstalledpatternSeriesMap[key].options.data && cdlstalledpatternSeriesMap[key].options.data.length > 0
                            && cdlstalledpatternOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLSTALLEDPATTERN series. Add one more CDLSTALLEDPATTERN point
                            //Calculate CDLSTALLEDPATTERN data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLSTALLEDPATTERN - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLSTALLEDPATTERN - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">SP</span>',
                                        text: 'Stalled Pattern : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">SP</span>',
                                        text: 'Stalled Pattern : Bear'
                                    }
                                };

                                var whereToUpdate = -1;
                                for (var sIndx = cdlstalledpatternSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlstalledpatternSeriesMap[key].data[sIndx].x || cdlstalledpatternSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlstalledpatternSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlstalledpatternSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlstalledpatternSeriesMap[key].data[whereToUpdate].remove();
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
