/**
 * Created by Mahboob.M on 12/29/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlgravestonedojiOptionsMap = {}, cdlgravestonedojiSeriesMap = {};

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

         
        var highWick = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
            candleBodySize = Math.abs(candleOne_Low - candleOne_High),
            isOpenCloseLowAlmostSame = ((candleOne_Open === candleOne_Close) || ((candleBodySize * 0.05) >= Math.abs(candleOne_Open - candleOne_Close)))
            && (candleOne_Low === Math.min(candleOne_Open, candleOne_Close)) || ((candleBodySize * 0.05) >= Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close))),
            isUpperShadowLong = highWick >= (candleBodySize * 0.80);

        var isBullishContinuation = isCandleTwo_Bearish //occurs at the top of downtrend
                                    && isOpenCloseLowAlmostSame //the open, high, and close are the same or about the same price
                                    && isUpperShadowLong;// The most important part of the Graveston Doji is the long upper shadow..

        var isBearishContinuation = isCandleTwo_Bullish //occurs at the top of uptrends
                                    && isOpenCloseLowAlmostSame //the open, high, and close are the same or about the same price
                                    && isUpperShadowLong;// The most important part of the Graveston Doji is the long upper shadow..
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
                if (!H || H.Series.prototype.addCDLGRAVESTONEDOJI) return;

                H.Series.prototype.addCDLGRAVESTONEDOJI = function (cdlgravestonedojiOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlgravestonedojiOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlgravestonedojiOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLGRAVESTONEDOJI series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLGRAVESTONEDOJI data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlgravestonedojiData = [];
                        for (var index = 1 ; index < data.length; index++) {

                            //Calculate CDLGRAVESTONEDOJI - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlgravestonedojiData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">GSD</span>',
                                    text: 'Gravestone Doji : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlgravestonedojiData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">GSD</span>',
                                    text: 'Gravestone Doji : Bear'
                                });
                            }
                            //Calculate CDLGRAVESTONEDOJI - end
                        };

                        var chart = this.chart;

                        cdlgravestonedojiOptionsMap[uniqueID] = cdlgravestonedojiOptions;

                        var series = this;
                        cdlgravestonedojiSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLGRAVESTONEDOJI',
                            data: cdlgravestonedojiData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlgravestonedojiSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlgravestonedoji',
                            parentSeriesID: cdlgravestonedojiOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLGRAVESTONEDOJI = function (uniqueID) {
                    var chart = this.chart;
                    cdlgravestonedojiOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlgravestonedojiSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLGRAVESTONEDOJI = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlgravestonedojiOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlgravestonedojieed, options, redraw, shift, animation) {

                    pcdlgravestonedojieed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlgravestonedojiOptionsMap, this.options.id)) {
                        updateCDLGRAVESTONEDOJISeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlgravestonedojieed, options, redraw, animation) {

                    pcdlgravestonedojieed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlgravestonedojiOptionsMap, this.series.options.id)) {
                        updateCDLGRAVESTONEDOJISeries.call(this.series, this.x, true);
                    }

                }); 
                

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLGRAVESTONEDOJISeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLGRAVESTONEDOJI data point
                    for (var key in cdlgravestonedojiSeriesMap) {
                        if (cdlgravestonedojiSeriesMap[key] && cdlgravestonedojiSeriesMap[key].options && cdlgravestonedojiSeriesMap[key].options.data && cdlgravestonedojiSeriesMap[key].options.data.length > 0
                            && cdlgravestonedojiOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLGRAVESTONEDOJI series. Add one more CDLGRAVESTONEDOJI point
                            //Calculate CDLGRAVESTONEDOJI data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLGRAVESTONEDOJI - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLGRAVESTONEDOJI - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">GSD</span>',
                                        text: 'Gravestone Doji : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">GSD</span>',
                                        text: 'Gravestone Doji : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlgravestonedojiSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlgravestonedojiSeriesMap[key].data[sIndx].x || cdlgravestonedojiSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlgravestonedojiSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlgravestonedojiSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlgravestonedojiSeriesMap[key].data[whereToUpdate].remove();
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
