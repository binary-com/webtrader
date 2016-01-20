/**
 * Created by Mahboob.M on 1/1/16.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlmatchinglowOptionsMap = {}, cdlmatchinglowSeriesMap = {};

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
            candleTwo_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleTwo_Index),
            candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index)
            candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index);

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
            isCandleOne_Bearish = candleOne_Close < candleOne_Open;


        var isBullishContinuation = isCandleTwo_Bearish && candleTwo_Open > candleOne_Open  // The first candle has a tall body
                                   && isCandleOne_Bearish && candleOne_Close === candleTwo_Close; //The second day follows with another black candlestick whose closing price is exactly equal to the closing price of the first day.

        //It's a bullish only indicator
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
                if (!H || H.Series.prototype.addCDLMATCHINGLOW) return;

                H.Series.prototype.addCDLMATCHINGLOW = function (cdlmatchinglowOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlmatchinglowOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlmatchinglowOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLMATCHINGLOW series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLMATCHINGLOW data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdlmatchinglowData = [];
                        for (var index = 1; index < data.length; index++) {

                            //Calculate CDLMATCHINGLOW - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            var isBullishContinuation = bull_bear.isBullishContinuation,
                                isBearishContinuation = bull_bear.isBearishContinuation;

                            if (isBullishContinuation) {
                                cdlmatchinglowData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">ML</span>',
                                    text: 'Matching Low : Bull'
                                });
                            };
                            //Calculate CDLMATCHINGLOW - end

                        }

                        var chart = this.chart;

                        cdlmatchinglowOptionsMap[uniqueID] = cdlmatchinglowOptions;


                        var series = this;
                        cdlmatchinglowSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLMATCHINGLOW',
                            data: cdlmatchinglowData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlmatchinglowSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlmatchinglow',
                            parentSeriesID: cdlmatchinglowOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLMATCHINGLOW = function (uniqueID) {
                    var chart = this.chart;
                    cdlmatchinglowOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlmatchinglowSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLMATCHINGLOW = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlmatchinglowOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlmatchingloweed, options, redraw, shift, animation) {

                    pcdlmatchingloweed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlmatchinglowOptionsMap, this.options.id)) {
                        updateCDLMATCHINGLOWSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlmatchingloweed, options, redraw, animation) {

                    pcdlmatchingloweed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlmatchinglowOptionsMap, this.series.options.id)) {
                        updateCDLMATCHINGLOWSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLMATCHINGLOWSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLMATCHINGLOW data point
                    for (var key in cdlmatchinglowSeriesMap) {
                        if (cdlmatchinglowSeriesMap[key] && cdlmatchinglowSeriesMap[key].options && cdlmatchinglowSeriesMap[key].options.data && cdlmatchinglowSeriesMap[key].options.data.length > 0
                            && cdlmatchinglowOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLMATCHINGLOW series. Add one more CDLMATCHINGLOW point
                            //Calculate CDLMATCHINGLOW data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdlmatchinglowOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLMATCHINGLOW - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLMATCHINGLOW - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">ML</span>',
                                        text: 'Matching Low : Bull'
                                    }
                                };

                                var whereToUpdate = -1;
                                for (var sIndx = cdlmatchinglowSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlmatchinglowSeriesMap[key].data[sIndx].x || cdlmatchinglowSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlmatchinglowSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlmatchinglowSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlmatchinglowSeriesMap[key].data[whereToUpdate].remove();
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
