/**
 * Created by Mahboob.M on 1/2/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlrisefall3methodsOptionsMap = {}, cdlrisefall3methodsSeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;
        var candleFor_Index = index - 3;
        var candleFive_Index = index - 4;


        var candleFive_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFive_Index),
			candleFive_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFive_Index),
            candleFive_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleFive_Index),
            candleFive_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleFive_Index);


        var candleFor_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFor_Index),
			candleFor_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFor_Index),
            candleFor_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleFor_Index),
            candleFor_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleFor_Index);


        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index),
            candleThree_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleThree_Index),
            candleThree_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleThree_Index);


        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
            candleTwo_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleTwo_Index),
            candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
            candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index);



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


        var isBullishContinuation = isCandleFive_Bullish && (Math.abs(candleFive_Close - candleFive_Open) > candleMediumHeight) //The first candlestick in this pattern is a light bullish candlestick with a large real body
                                    && isCandleFor_Bearish && candleFor_Low > candleFive_Low && candleFor_High < candleFive_High // it should be within the high and low of the first candlestick. 
                                    && isCandleThree_Bearish && candleThree_Low > candleFive_Low && candleThree_High < candleFive_High // it should be within the high and low of the first candlestick. 
                                    && isCandleTwo_Bearish && candleTwo_Low > candleFive_Low && candleTwo_High < candleFive_High // it should be within the high and low of the first candlestick. 
                                    && isCandleOne_Bullish && candleOne_Open > candleTwo_Close && candleOne_Close > candleFive_Close;//he last candlestick that completes the pattern should open higher than the close of its preceding candlestick and should close above the close of the first candlestick.

        var isBearishContinuation = isCandleFive_Bearish && (Math.abs(candleFive_Close - candleFive_Open) > candleMediumHeight)
                                    && isCandleFor_Bullish && candleFor_Low > candleFive_Low && candleFor_High < candleFive_High // it should be within the high and low of the first candlestick. 
                                    && isCandleThree_Bullish && candleThree_Low > candleFive_Low && candleThree_High < candleFive_High // it should be within the high and low of the first candlestick. 
                                    && isCandleTwo_Bullish && candleTwo_Low > candleFive_Low && candleTwo_High < candleFive_High // it should be within the high and low of the first candlestick. 
                                    && isCandleOne_Bearish && candleOne_Open < candleTwo_Close && candleOne_Close < candleFive_Close;//The last candlestick that completes the pattern should below the close of its preceding candlestick and should close lower that the close of the first candlestick.


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
                if (!H || H.Series.prototype.addCDLRISEFALL3METHODS) return;

                H.Series.prototype.addCDLRISEFALL3METHODS = function (cdlrisefall3methodsOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlrisefall3methodsOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlrisefall3methodsOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLRISEFALL3METHODS series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLRISEFALL3METHODS data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlrisefall3methodsData = [];
                        for (var index = 4 ; index < data.length; index++) {

                            //Calculate CDLRISEFALL3METHODS - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlrisefall3methodsData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">RFTM</span>',
                                    text: 'Rising Three Methods : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlrisefall3methodsData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">RFTM</span>',
                                    text: 'Falling Three Methods : Bear'
                                });
                            }
                            //Calculate CDLRISEFALL3METHODS - end
                        };

                        var chart = this.chart;

                        cdlrisefall3methodsOptionsMap[uniqueID] = cdlrisefall3methodsOptions;

                        var series = this;
                        cdlrisefall3methodsSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLRISEFALL3METHODS',
                            data: cdlrisefall3methodsData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlrisefall3methodsSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlrisefall3methods',
                            parentSeriesID: cdlrisefall3methodsOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLRISEFALL3METHODS = function (uniqueID) {
                    var chart = this.chart;
                    cdlrisefall3methodsOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlrisefall3methodsSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLRISEFALL3METHODS = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlrisefall3methodsOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlrisefall3methodseed, options, redraw, shift, animation) {

                    pcdlrisefall3methodseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlrisefall3methodsOptionsMap, this.options.id)) {
                        updateCDLRISEFALL3METHODSSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlrisefall3methodseed, options, redraw, animation) {

                    pcdlrisefall3methodseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlrisefall3methodsOptionsMap, this.series.options.id)) {
                        updateCDLRISEFALL3METHODSSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLRISEFALL3METHODSSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLRISEFALL3METHODS data point
                    for (var key in cdlrisefall3methodsSeriesMap) {
                        if (cdlrisefall3methodsSeriesMap[key] && cdlrisefall3methodsSeriesMap[key].options && cdlrisefall3methodsSeriesMap[key].options.data && cdlrisefall3methodsSeriesMap[key].options.data.length > 0
                            && cdlrisefall3methodsOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLRISEFALL3METHODS series. Add one more CDLRISEFALL3METHODS point
                            //Calculate CDLRISEFALL3METHODS data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLRISEFALL3METHODS - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLRISEFALL3METHODS - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">RFTM</span>',
                                        text: 'Rising Three Methods : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">RFTM</span>',
                                        text: 'Falling Three Methods : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlrisefall3methodsSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlrisefall3methodsSeriesMap[key].data[sIndx].x || cdlrisefall3methodsSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlrisefall3methodsSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlrisefall3methodsSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlrisefall3methodsSeriesMap[key].data[whereToUpdate].remove();
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
