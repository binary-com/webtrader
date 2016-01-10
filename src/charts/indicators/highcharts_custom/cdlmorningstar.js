/**
 * Created by Mahboob.M on 1/2/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlmorningstarOptionsMap = {}, cdlmorningstarSeriesMap = {};

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;
        var candleFor_Index = index - 3;

        var candleFor_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFor_Index),
            candleFor_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFor_Index);

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var isCandleFor_Bearish = candleFor_Close < candleFor_Open;

        var isCandleThree_Bearish = candleThree_Close < candleThree_Open;

        var isCandleOne_Bullish = candleOne_Close > candleOne_Open;

        var candleOneBody = Math.abs(candleOne_Open - candleOne_Close);
        var candleTwoBody = Math.abs(candleTwo_Open - candleTwo_Close);
        var candleThreeBody = Math.abs(candleThree_Open - candleThree_Close);

        var isBullishContinuation = (candleThree_Close < Math.min(candleFor_Close,candleFor_Open)) //its a bullish reversal pattern, usually occuring at the bottom of a downtrend. 
                                    && isCandleThree_Bearish && (candleThreeBody > (candleTwoBody * 3)) //The first part of an Evening Star reversal pattern is a large bullish green candle.
                                    && (candleTwoBody < (candleThreeBody / 3)) && (Math.max(candleTwo_Open, candleTwo_Close) < candleThree_Close) //The second day begins with a gap down and it is quite small and can be bullish or bearish.
                                    && isCandleOne_Bullish && (candleOneBody > candleTwoBody * 3) && (candleOne_Open > Math.max(candleTwo_Open, candleTwo_Close))//a large Bearish Candle than opens above the middle candle  and closes near the center of the first bar's body
                                    && candleOne_Close < candleThree_Open;

        //Morning Star is bullish only
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
                if (!H || H.Series.prototype.addCDLMORNINGSTAR) return;

                H.Series.prototype.addCDLMORNINGSTAR = function (cdlmorningstarOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlmorningstarOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlmorningstarOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLMORNINGSTAR series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLMORNINGSTAR data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlmorningstarData = [];
                        for (var index = 3 ; index < data.length; index++) {

                            //Calculate CDLMORNINGSTAR - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            //Morning Star is bullish only
                            if (bull_bear.isBullishContinuation) {
                                cdlmorningstarData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">MS</span>',
                                    text: 'Morning Star : Bull'
                                });
                            };
                        };

                        var chart = this.chart;

                        cdlmorningstarOptionsMap[uniqueID] = cdlmorningstarOptions;

                        var series = this;
                        cdlmorningstarSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLMORNINGSTAR',
                            data: cdlmorningstarData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlmorningstarSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlmorningstar',
                            parentSeriesID: cdlmorningstarOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLMORNINGSTAR = function (uniqueID) {
                    var chart = this.chart;
                    cdlmorningstarOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlmorningstarSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLMORNINGSTAR = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlmorningstarOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlmorningstareed, options, redraw, shift, animation) {

                    pcdlmorningstareed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlmorningstarOptionsMap, this.options.id)) {
                        updateCDLMORNINGSTARSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlmorningstareed, options, redraw, animation) {

                    pcdlmorningstareed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlmorningstarOptionsMap, this.series.options.id)) {
                        updateCDLMORNINGSTARSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLMORNINGSTARSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLMORNINGSTAR data point
                    for (var key in cdlmorningstarSeriesMap) {
                        if (cdlmorningstarSeriesMap[key] && cdlmorningstarSeriesMap[key].options && cdlmorningstarSeriesMap[key].options.data && cdlmorningstarSeriesMap[key].options.data.length > 0
                            && cdlmorningstarOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLMORNINGSTAR series. Add one more CDLMORNINGSTAR point
                            //Calculate CDLMORNINGSTAR data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLMORNINGSTAR - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLMORNINGSTAR - end
                                var bullBearData = null;
                                //Morning Star is bullish only
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">MS</span>',
                                        text: 'Morning Star : Bull'
                                    }
                                };

                                var whereToUpdate = -1;
                                for (var sIndx = cdlmorningstarSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlmorningstarSeriesMap[key].data[sIndx].x || cdlmorningstarSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlmorningstarSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlmorningstarSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlmorningstarSeriesMap[key].data[whereToUpdate].remove();
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
