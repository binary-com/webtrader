/**
 * Created by Mahboob.M on 12/29/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlbeltholdOptionsMap = {}, cdlbeltholdSeriesMap = {};

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
            candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index);

        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
			isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;


        var isBullishContinuation = isCandleThree_Bearish  //After a stretch of bearish candlestick
                                    && isCandleTwo_Bearish //After a stretch of bearish candlestick
                                    && isCandleOne_Bullish && candleOne_Open === candleOne_Low && candleOne_Open < candleTwo_Close;// a bullish or white candlestick forms. The opening price, which becomes the low for the day, is significantly lower then the closing price.

        var isBearishContinuation = isCandleThree_Bullish  //After a stretch of bullish candlestick
                                    && isCandleTwo_Bullish //After a stretch of bullish candlestick
                                    && isCandleOne_Bearish && candleOne_Open === candleOne_High && candleOne_Open > candleTwo_Close;// a bearish or black candlestick forms. the opening price, which becomes the high for the day, is higher than the close of the previous day.
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
                if (!H || H.Series.prototype.addCDLBELTHOLD) return;

                H.Series.prototype.addCDLBELTHOLD = function (cdlbeltholdOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlbeltholdOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlbeltholdOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLBELTHOLD series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLBELTHOLD data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlbeltholdData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLBELTHOLD - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlbeltholdData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">BH</span>',
                                    text: 'Belt-hold : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlbeltholdData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">BH</span>',
                                    text: 'Belt-hold : Bear'
                                });
                            }
                            //Calculate CDLBELTHOLD - end
                        };

                        var chart = this.chart;

                        cdlbeltholdOptionsMap[uniqueID] = cdlbeltholdOptions;

                        var series = this;
                        cdlbeltholdSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLBELTHOLD',
                            data: cdlbeltholdData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlbeltholdSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlbelthold',
                            parentSeriesID: cdlbeltholdOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLBELTHOLD = function (uniqueID) {
                    var chart = this.chart;
                    cdlbeltholdOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlbeltholdSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLBELTHOLD = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlbeltholdOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlbeltholdeed, options, redraw, shift, animation) {

                    pcdlbeltholdeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlbeltholdOptionsMap, this.options.id)) {
                        updateCDLBELTHOLDSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlbeltholdeed, options, redraw, animation) {

                    pcdlbeltholdeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlbeltholdOptionsMap, this.series.options.id)) {
                        updateCDLBELTHOLDSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLBELTHOLDSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLBELTHOLD data point
                    for (var key in cdlbeltholdSeriesMap) {
                        if (cdlbeltholdSeriesMap[key] && cdlbeltholdSeriesMap[key].options && cdlbeltholdSeriesMap[key].options.data && cdlbeltholdSeriesMap[key].options.data.length > 0
                            && cdlbeltholdOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLBELTHOLD series. Add one more CDLBELTHOLD point
                            //Calculate CDLBELTHOLD data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLBELTHOLD - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLBELTHOLD - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">BH</span>',
                                        text: 'Belt-hold : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">BH</span>',
                                        text: 'Belt-hold : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlbeltholdSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlbeltholdSeriesMap[key].data[sIndx].x || cdlbeltholdSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlbeltholdSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlbeltholdSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlshootingstarSeriesMap[key].data[whereToUpdate].remove();
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
