/**
 * Created by Mahboob.M on 12/30/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdleveningstarOptionsMap = {}, cdleveningstarSeriesMap = {};
    var candleMediumHeight = 0;

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
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
            candleTwo_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleTwo_Index),
            candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var isCandleFor_Bullish = candleFor_Close > candleFor_Open;
		
        var isCandleThree_Bullish = candleThree_Close > candleThree_Open;

        var isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var candleOneBody = Math.abs(candleOne_Open - candleOne_Close);
        var candleTwoBody = Math.abs(candleTwo_Open - candleTwo_Close);
        var candleTwoSize = Math.abs(candleTwo_Low - candleTwo_High);
        var candleThreeBody = Math.abs(candleThree_Open - candleThree_Close);

        var isBullishContinuation = false;

        //Evening Star is bearish only
        var isBearishContinuation = isCandleFor_Bullish  //occurs at the top of an uptrend.
                                    && isCandleThree_Bullish && (candleThreeBody > candleMediumHeight) //The first part of an Evening Star reversal pattern is a large bullish green candle.
                                    && (candleTwoBody < candleMediumHeight) && (candleTwoBody >= candleTwoSize * 0.10) && (Math.min(candleTwo_Open, candleTwo_Close) > candleThree_Close) //The second day begins with a gap up and it is quite small and can be bullish or bearish.
                                    && isCandleOne_Bearish && (candleOneBody > candleMediumHeight) && (candleOne_Open < Math.min(candleTwo_Open, candleTwo_Close))//a large Bearish Candle with gap down.
                                    && candleOne_Close > candleThree_Open && candleOne_Close < candleThree_Close;
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
                if (!H || H.Series.prototype.addCDLEVENINGSTAR) return;

                H.Series.prototype.addCDLEVENINGSTAR = function (cdleveningstarOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdleveningstarOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdleveningstarOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLEVENINGSTAR series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLEVENINGSTAR data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdleveningstarData = [];
                        for (var index = 3 ; index < data.length; index++) {

                            //Calculate CDLEVENINGSTAR - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            //Evening Star is bearish only
                            if (bull_bear.isBearishContinuation) {
                                cdleveningstarData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">ES</span>',
                                    text: 'Evening Star : Bear'
                                });
                            }
                        };

                        var chart = this.chart;

                        cdleveningstarOptionsMap[uniqueID] = cdleveningstarOptions;

                        var series = this;
                        cdleveningstarSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLEVENINGSTAR',
                            data: cdleveningstarData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdleveningstarSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdleveningstar',
                            parentSeriesID: cdleveningstarOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLEVENINGSTAR = function (uniqueID) {
                    var chart = this.chart;
                    cdleveningstarOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdleveningstarSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLEVENINGSTAR = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdleveningstarOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdleveningstareed, options, redraw, shift, animation) {

                    pcdleveningstareed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdleveningstarOptionsMap, this.options.id)) {
                        updateCDLEVENINGSTARSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdleveningstareed, options, redraw, animation) {

                    pcdleveningstareed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdleveningstarOptionsMap, this.series.options.id)) {
                        updateCDLEVENINGSTARSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLEVENINGSTARSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLEVENINGSTAR data point
                    for (var key in cdleveningstarSeriesMap) {
                        if (cdleveningstarSeriesMap[key] && cdleveningstarSeriesMap[key].options && cdleveningstarSeriesMap[key].options.data && cdleveningstarSeriesMap[key].options.data.length > 0
                            && cdleveningstarOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLEVENINGSTAR series. Add one more CDLEVENINGSTAR point
                            //Calculate CDLEVENINGSTAR data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLEVENINGSTAR - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLEVENINGSTAR - end
                                var bullBearData = null;
                                //Evening Star is bearish only
                                if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">ES</span>',
                                        text: 'Evening Star : Bear'
                                    }
                                };

                                var whereToUpdate = -1;
                                for (var sIndx = cdleveningstarSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdleveningstarSeriesMap[key].data[sIndx].x || cdleveningstarSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdleveningstarSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdleveningstarSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdleveningstarSeriesMap[key].data[whereToUpdate].remove();
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
