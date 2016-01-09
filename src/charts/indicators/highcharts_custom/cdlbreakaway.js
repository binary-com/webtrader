/**
 * Created by Mahboob.M on 1/4/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlbreakawayOptionsMap = {}, cdlbreakawaySeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;
        var candleFor_Index = index - 3;
        var candleFive_Index = index - 4;

        var candleFive_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFive_Index),
            candleFive_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFive_Index);

        var candleFor_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFor_Index),
			candleFor_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFor_Index);

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var isCandleFive_Bullish = candleFive_Close > candleFive_Open,
            isCandleFive_Bearish = candleFive_Close < candleFive_Open;

        var isCandleFor_Bullish = candleFor_Close > candleFor_Open,
            isCandleFor_Bearish = candleFor_Close < candleFor_Open;

        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
			isCandleThree_Bearish = candleThree_Close < candleThree_Open;

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var candleFiveBody = Math.abs(candleFive_Close - candleFive_Open);
        var shortCandleSize = candleFiveBody / 2;

        var isBullishContinuation = isCandleFive_Bearish && (candleFiveBody > candleMediumHeight)
                                  && isCandleFor_Bearish && (Math.abs(candleFor_Close - candleFor_Open) < shortCandleSize) && (candleFor_Open < candleFive_Close)
                                  && (Math.abs(candleThree_Close - candleThree_Open) < shortCandleSize) && (Math.min(candleThree_Close, candleThree_Open) < candleFor_Close)
                                  && (Math.abs(candleTwo_Close - candleTwo_Open) < shortCandleSize) && (Math.min(candleTwo_Close, candleTwo_Open) < Math.min(candleThree_Close, candleThree_Open))
                                  && isCandleOne_Bullish //The fifth day is a long blue day 
                                  && (candleOne_Open > (Math.min(candleTwo_Close, candleTwo_Open)))
                                  && (candleOne_Close > candleFor_Open) && (candleOne_Close < candleFive_Open);//closes inside the gap formed between the first two days..


        var isBearishContinuation = isCandleFive_Bullish && (candleFiveBody > candleMediumHeight)
                                  && isCandleFor_Bullish && (Math.abs(candleFor_Close - candleFor_Open) < shortCandleSize) && (candleFor_Open > candleFive_Close)
                                  && (Math.abs(candleThree_Close - candleThree_Open) < shortCandleSize) && (Math.max(candleThree_Close, candleThree_Open) > candleFor_Close)
                                  && (Math.abs(candleTwo_Close - candleTwo_Open) < shortCandleSize) && (Math.max(candleTwo_Close, candleTwo_Open) > Math.max(candleThree_Close, candleThree_Open))
                                  && isCandleOne_Bearish //The fifth day is a long red day 
                                  && (candleOne_Open < (Math.max(candleTwo_Close, candleTwo_Open)))
                                  && (candleOne_Close < candleFor_Open) && (candleOne_Close > candleFive_Close);//that closes inside of the gap between the first and second candle


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
                if (!H || H.Series.prototype.addCDLBREAKAWAY) return;

                H.Series.prototype.addCDLBREAKAWAY = function (cdlbreakawayOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlbreakawayOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlbreakawayOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLBREAKAWAY series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLBREAKAWAY data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlbreakawayData = [];
                        for (var index = 4 ; index < data.length; index++) {

                            //Calculate CDLBREAKAWAY - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlbreakawayData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">BA</span>',
                                    text: 'Breakaway : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlbreakawayData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">BA</span>',
                                    text: 'Breakaway : Bear'
                                });
                            }
                            //Calculate CDLBREAKAWAY - end
                        };

                        var chart = this.chart;

                        cdlbreakawayOptionsMap[uniqueID] = cdlbreakawayOptions;

                        var series = this;
                        cdlbreakawaySeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLBREAKAWAY',
                            data: cdlbreakawayData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlbreakawaySeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlbreakaway',
                            parentSeriesID: cdlbreakawayOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLBREAKAWAY = function (uniqueID) {
                    var chart = this.chart;
                    cdlbreakawayOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlbreakawaySeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLBREAKAWAY = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlbreakawayOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlbreakawayeed, options, redraw, shift, animation) {

                    pcdlbreakawayeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlbreakawayOptionsMap, this.options.id)) {
                        updateCDLBREAKAWAYSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlbreakawayeed, options, redraw, animation) {

                    pcdlbreakawayeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlbreakawayOptionsMap, this.series.options.id)) {
                        updateCDLBREAKAWAYSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLBREAKAWAYSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLBREAKAWAY data point
                    for (var key in cdlbreakawaySeriesMap) {
                        if (cdlbreakawaySeriesMap[key] && cdlbreakawaySeriesMap[key].options && cdlbreakawaySeriesMap[key].options.data && cdlbreakawaySeriesMap[key].options.data.length > 0
                            && cdlbreakawayOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLBREAKAWAY series. Add one more CDLBREAKAWAY point
                            //Calculate CDLBREAKAWAY data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLBREAKAWAY - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLBREAKAWAY - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">BA</span>',
                                        text: 'Breakaway : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">BA</span>',
                                        text: 'Breakaway : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlbreakawaySeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlbreakawaySeriesMap[key].data[sIndx].x || cdlbreakawaySeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlbreakawaySeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlbreakawaySeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlbreakawaySeriesMap[key].data[whereToUpdate].remove();
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
