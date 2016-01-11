/**
 * Created by Mahboob.M on 12/29/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlunique3riverMap = {}, cdlhammerSeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;
        var candleFor_Index = index - 3;

        var candleFor_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFor_Index),
            candleFor_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFor_Index);

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index),
            candleThree_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleThree_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
            candleTwo_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleTwo_Index),
			candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var isCandleFor_Bearish = candleFor_Close < candleFor_Open;
		var	isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open;


        var candleTwoUpperShadow = Math.abs(candleTwo_Open - candleTwo_High);
        var candleTwoBody = Math.abs(candleTwo_Open - candleTwo_Close);
        var candleTwoLowerShadow = Math.abs(candleTwo_Low - candleTwo_Close);
        var isCandleTwoHammer = (candleTwoLowerShadow >= (2.0 * candleTwoBody)) && (candleTwoUpperShadow <= (candleTwoBody * 0.10)) && (candleTwoBody < candleMediumHeight);

        var candleThreeBody = Math.abs(candleThree_Close - candleThree_Open);

        var isBullishContinuation = isCandleFor_Bearish
                                    && isCandleThree_Bearish && candleThreeBody > candleMediumHeight && candleThree_Close < candleFor_Close//The 1st candle has a long and bearish body
                                    && isCandleTwo_Bearish && isCandleTwoHammer && candleTwo_Close > candleThree_Close && candleTwo_Open < candleThree_Open && candleTwo_Low < candleThree_Low //The 2nd candle is a hammer, and its body is inside the 1st bar's body;
                                    && isCandleOne_Bullish && candleOne_Close < candleTwo_Close; //tThe 3rd candle is small and bullish, its Close price is lower than 2nd bar's.


        //Unique 3 River is bullish only
        var isBearishContinuation = false;
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
                if (!H || H.Series.prototype.addCDLUNIQUE3RIVER) return;

                H.Series.prototype.addCDLUNIQUE3RIVER = function (cdlunique3river) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlunique3river = $.extend({
                        parentSeriesID: seriesID
                    }, cdlunique3river);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLUNIQUE3RIVER series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLUNIQUE3RIVER data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlhammerData = [];
                        for (var index = 3 ; index < data.length; index++) {

                            //Calculate CDLUNIQUE3RIVER - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            //Unique 3 River is bullish only
                            if (bull_bear.isBullishContinuation) {
                                cdlhammerData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">U3R</span>',
                                    text: 'Unique 3 River : Bull'
                                });
                            };
                        };

                        var chart = this.chart;

                        cdlunique3riverMap[uniqueID] = cdlunique3river;

                        var series = this;
                        cdlhammerSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLUNIQUE3RIVER',
                            data: cdlhammerData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlhammerSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlhammer',
                            parentSeriesID: cdlunique3river.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLUNIQUE3RIVER = function (uniqueID) {
                    var chart = this.chart;
                    cdlunique3riverMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlhammerSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLUNIQUE3RIVER = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlunique3riverMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlhammereed, options, redraw, shift, animation) {

                    pcdlhammereed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlunique3riverMap, this.options.id)) {
                        updateCDLUNIQUE3RIVERSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlhammereed, options, redraw, animation) {

                    pcdlhammereed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlunique3riverMap, this.series.options.id)) {
                        updateCDLUNIQUE3RIVERSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLUNIQUE3RIVERSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLUNIQUE3RIVER data point
                    for (var key in cdlhammerSeriesMap) {
                        if (cdlhammerSeriesMap[key] && cdlhammerSeriesMap[key].options && cdlhammerSeriesMap[key].options.data && cdlhammerSeriesMap[key].options.data.length > 0
                            && cdlunique3riverMap[key].parentSeriesID == series.options.id) {
                            //This is CDLUNIQUE3RIVER series. Add one more CDLUNIQUE3RIVER point
                            //Calculate CDLUNIQUE3RIVER data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLUNIQUE3RIVER - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLUNIQUE3RIVER - end
                                var bullBearData = null;
                                //Unique 3 River is bullish only
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">U3R</span>',
                                        text: 'Unique 3 River : Bull'
                                    }
                                };

                                var whereToUpdate = -1;
                                for (var sIndx = cdlhammerSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlhammerSeriesMap[key].data[sIndx].x || cdlhammerSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlhammerSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlhammerSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlhammerSeriesMap[key].data[whereToUpdate].remove();
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
