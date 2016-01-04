/**
 * Created by Mahboob.M on 1/4/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdleveningdojistarOptionsMap = {}, cdleveningdojistarSeriesMap = {};
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

        var candleOneBody = Math.abs(candleOne_Open - candleOne_Close),
         candleThreeBody = Math.abs(candleThree_Open - candleThree_Close),
         candleTwoBody = Math.abs(candleTwo_Low - candleTwo_High),
         iscandleTwoDoji = candleTwo_Open === candleTwo_Close || ((candleTwoBody * 0.10) >= Math.abs(candleTwo_Open - candleTwo_Close));

        var isBullishContinuation = false;

        //Evening Star is bearish only
        var isBearishContinuation = isCandleFor_Bullish  //occurs at the top of an uptrend.
                                    && isCandleThree_Bullish && (candleThreeBody > candleMediumHeight)  //The first part of an Evening Star reversal pattern is a large bullish green candle.
                                    && iscandleTwoDoji && (Math.min(candleTwo_Open, candleTwo_Close) > candleThree_Close) //The second day begins with a gap up and it is quite small and can be bullish or bearish.
                                    && isCandleOne_Bearish && (candleOneBody > candleMediumHeight) && (candleOne_Open < Math.min(candleTwo_Open, candleTwo_Close))//a large Bearish Candle with gap down.
                                    && candleOne_Close > candleThree_Open && candleOne_Close < candleThree_Close; //closes well within the body of the first candle
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
                if (!H || H.Series.prototype.addCDLEVENINGDOJISTAR) return;

                H.Series.prototype.addCDLEVENINGDOJISTAR = function (cdleveningdojistarOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdleveningdojistarOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdleveningdojistarOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLEVENINGDOJISTAR series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLEVENINGDOJISTAR data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdleveningdojistarData = [];
                        for (var index = 3 ; index < data.length; index++) {

                            //Calculate CDLEVENINGDOJISTAR - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            //Evening Star is bearish only
                            if (bull_bear.isBearishContinuation) {
                                cdleveningdojistarData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">EDS</span>',
                                    text: 'Evening Doji Star : Bear'
                                });
                            }
                        };

                        var chart = this.chart;

                        cdleveningdojistarOptionsMap[uniqueID] = cdleveningdojistarOptions;

                        var series = this;
                        cdleveningdojistarSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLEVENINGDOJISTAR',
                            data: cdleveningdojistarData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdleveningdojistarSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdleveningdojistar',
                            parentSeriesID: cdleveningdojistarOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLEVENINGDOJISTAR = function (uniqueID) {
                    var chart = this.chart;
                    cdleveningdojistarOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdleveningdojistarSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLEVENINGDOJISTAR = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdleveningdojistarOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdleveningdojistareed, options, redraw, shift, animation) {

                    pcdleveningdojistareed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdleveningdojistarOptionsMap, this.options.id)) {
                        updateCDLEVENINGDOJISTARSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdleveningdojistareed, options, redraw, animation) {

                    pcdleveningdojistareed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdleveningdojistarOptionsMap, this.series.options.id)) {
                        updateCDLEVENINGDOJISTARSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLEVENINGDOJISTARSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLEVENINGDOJISTAR data point
                    for (var key in cdleveningdojistarSeriesMap) {
                        if (cdleveningdojistarSeriesMap[key] && cdleveningdojistarSeriesMap[key].options && cdleveningdojistarSeriesMap[key].options.data && cdleveningdojistarSeriesMap[key].options.data.length > 0
                            && cdleveningdojistarOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLEVENINGDOJISTAR series. Add one more CDLEVENINGDOJISTAR point
                            //Calculate CDLEVENINGDOJISTAR data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLEVENINGDOJISTAR - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLEVENINGDOJISTAR - end
                                var bullBearData = null;
                                //Evening Star is bearish only
                                if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">EDS</span>',
                                        text: 'Evening Doji Star : Bear'
                                    }
                                };

                                var whereToUpdate = -1;
                                for (var sIndx = cdleveningdojistarSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdleveningdojistarSeriesMap[key].data[sIndx].x || cdleveningdojistarSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdleveningdojistarSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdleveningdojistarSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdleveningdojistarSeriesMap[key].data[whereToUpdate].remove();
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
