/**
 * Created by Mahboob.M on 1/4/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlmorningdojistarOptionsMap = {}, cdlmorningdojistarSeriesMap = {};
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

        var isCandleFor_Bearish = candleFor_Close < candleFor_Open;

        var isCandleThree_Bearish = candleThree_Close < candleThree_Open;

        var isCandleOne_Bullish = candleOne_Close > candleOne_Open;

        var candleOneBody = Math.abs(candleOne_Open - candleOne_Close),
         candleThreeBody = Math.abs(candleThree_Open - candleThree_Close),
         candleTwoBody = Math.abs(candleTwo_Low - candleTwo_High),
         iscandleTwoDoji = candleTwo_Open === candleTwo_Close || ((candleTwoBody * 0.10) >= Math.abs(candleTwo_Open - candleTwo_Close));

      
        //Morning Doji Star is bullish only
        var isBullishContinuation = isCandleFor_Bearish  //occurs within a defined downtrend.
                                    && isCandleThree_Bearish && (candleThreeBody > candleMediumHeight)  //The first part of an Evening Star reversal pattern is a large bullish green candle.
                                    && iscandleTwoDoji && (Math.max(candleTwo_Open, candleTwo_Close) < candleThree_Close) //The second day begins with a gap down and it is quite small and can be bullish or bearish.
                                    && isCandleOne_Bullish && (candleOneBody > candleMediumHeight) && (candleOne_Open > Math.max(candleTwo_Open, candleTwo_Close))//a large Bullish Candle with gap up.
                                    && candleOne_Close < candleThree_Open && candleOne_Close > candleThree_Close; //closes well within the body of the first candle

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
                if (!H || H.Series.prototype.addCDLMORNINGDOJISTAR) return;

                H.Series.prototype.addCDLMORNINGDOJISTAR = function (cdlmorningdojistarOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlmorningdojistarOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlmorningdojistarOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLMORNINGDOJISTAR series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLMORNINGDOJISTAR data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlmorningdojistarData = [];
                        for (var index = 3 ; index < data.length; index++) {

                            //Calculate CDLMORNINGDOJISTAR - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            //Morning Doji Star is bullish only
                            if (bull_bear.isBullishContinuation) {
                                cdlmorningdojistarData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">MDS</span>',
                                    text: 'Morning Doji Star : Bull'
                                });
                            }
                        };

                        var chart = this.chart;

                        cdlmorningdojistarOptionsMap[uniqueID] = cdlmorningdojistarOptions;

                        var series = this;
                        cdlmorningdojistarSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLMORNINGDOJISTAR',
                            data: cdlmorningdojistarData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlmorningdojistarSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlmorningdojistar',
                            parentSeriesID: cdlmorningdojistarOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLMORNINGDOJISTAR = function (uniqueID) {
                    var chart = this.chart;
                    cdlmorningdojistarOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlmorningdojistarSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLMORNINGDOJISTAR = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlmorningdojistarOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlmorningdojistareed, options, redraw, shift, animation) {

                    pcdlmorningdojistareed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlmorningdojistarOptionsMap, this.options.id)) {
                        updateCDLMORNINGDOJISTARSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlmorningdojistareed, options, redraw, animation) {

                    pcdlmorningdojistareed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlmorningdojistarOptionsMap, this.series.options.id)) {
                        updateCDLMORNINGDOJISTARSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLMORNINGDOJISTARSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLMORNINGDOJISTAR data point
                    for (var key in cdlmorningdojistarSeriesMap) {
                        if (cdlmorningdojistarSeriesMap[key] && cdlmorningdojistarSeriesMap[key].options && cdlmorningdojistarSeriesMap[key].options.data && cdlmorningdojistarSeriesMap[key].options.data.length > 0
                            && cdlmorningdojistarOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLMORNINGDOJISTAR series. Add one more CDLMORNINGDOJISTAR point
                            //Calculate CDLMORNINGDOJISTAR data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLMORNINGDOJISTAR - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLMORNINGDOJISTAR - end
                                var bullBearData = null;
                                //Morning Doji Star is bullish only
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">MDJ</span>',
                                        text: 'Morning Doji Star : Bull'
                                    }
                                };

                                var whereToUpdate = -1;
                                for (var sIndx = cdlmorningdojistarSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlmorningdojistarSeriesMap[key].data[sIndx].x || cdlmorningdojistarSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlmorningdojistarSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlmorningdojistarSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlmorningdojistarSeriesMap[key].data[whereToUpdate].remove();
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
