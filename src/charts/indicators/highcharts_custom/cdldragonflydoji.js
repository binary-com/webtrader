/**
 * Created by Mahboob.M on 1/3/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdldragonflydojiOptionsMap = {}, cdldragonflydojiSeriesMap = {};

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
			candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index);

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

        var lowWick = Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close)),
            highWick = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
            candleBodySize = Math.abs(candleOne_Low - candleOne_High),
            realBodySize = Math.abs(candleOne_Open - candleOne_Close),
            isOpenCloseHighAlmostSame = ((candleOne_Open === candleOne_Close) || (realBodySize < (candleBodySize * 0.1)))
             && ((candleOne_High === Math.max(candleOne_Open, candleOne_Close)) || (highWick < (candleBodySize * 0.1))),
            isLowerShadowLong = (lowWick >= (candleBodySize * 0.60));

        var isBullishContinuation = isCandleTwo_Bearish //occurs at the bottom of downtrends.
                                    && isOpenCloseHighAlmostSame //the open, high, and close are the same or about the same price
                                    && isLowerShadowLong;// The most important part of the Dragonfly Doji is the long lower shadow.

        var isBearishContinuation = isCandleTwo_Bullish //occurs at the top of uptrends
                                    && isOpenCloseHighAlmostSame //the open, high, and close are the same or about the same price
                                    && isLowerShadowLong;// The most important part of the Dragonfly Doji is the long lower shadow.
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
                if (!H || H.Series.prototype.addCDLDRAGONFLYDOJI) return;

                H.Series.prototype.addCDLDRAGONFLYDOJI = function (cdldragonflydojiOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdldragonflydojiOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdldragonflydojiOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLDRAGONFLYDOJI series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLDRAGONFLYDOJI data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdldragonflydojiData = [];
                        for (var index = 1 ; index < data.length; index++) {

                            //Calculate CDLDRAGONFLYDOJI - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdldragonflydojiData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">DD</span>',
                                    text: 'Dragonfly Doji : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdldragonflydojiData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">DD</span>',
                                    text: 'Dragonfly Doji : Bear'
                                });
                            }
                            //Calculate CDLDRAGONFLYDOJI - end
                        };

                        var chart = this.chart;

                        cdldragonflydojiOptionsMap[uniqueID] = cdldragonflydojiOptions;

                        var series = this;
                        cdldragonflydojiSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLDRAGONFLYDOJI',
                            data: cdldragonflydojiData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdldragonflydojiSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdldragonflydoji',
                            parentSeriesID: cdldragonflydojiOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLDRAGONFLYDOJI = function (uniqueID) {
                    var chart = this.chart;
                    cdldragonflydojiOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdldragonflydojiSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLDRAGONFLYDOJI = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdldragonflydojiOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdldragonflydojieed, options, redraw, shift, animation) {

                    pcdldragonflydojieed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdldragonflydojiOptionsMap, this.options.id)) {
                        updateCDLDRAGONFLYDOJISeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdldragonflydojieed, options, redraw, animation) {

                    pcdldragonflydojieed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdldragonflydojiOptionsMap, this.series.options.id)) {
                        updateCDLDRAGONFLYDOJISeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLDRAGONFLYDOJISeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLDRAGONFLYDOJI data point
                    for (var key in cdldragonflydojiSeriesMap) {
                        if (cdldragonflydojiSeriesMap[key] && cdldragonflydojiSeriesMap[key].options && cdldragonflydojiSeriesMap[key].options.data && cdldragonflydojiSeriesMap[key].options.data.length > 0
                            && cdldragonflydojiOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLDRAGONFLYDOJI series. Add one more CDLDRAGONFLYDOJI point
                            //Calculate CDLTAKURI data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLDRAGONFLYDOJI - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLDRAGONFLYDOJI - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">DD</span>',
                                        text: 'Dragonfly Doji : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">DD</span>',
                                        text: 'Dragonfly Doji : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdldragonflydojiSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdldragonflydojiSeriesMap[key].data[sIndx].x || cdldragonflydojiSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdldragonflydojiSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdldragonflydojiSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdldragonflydojiSeriesMap[key].data[whereToUpdate].remove();
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
