/**
 * Created by Mahboob.M on 1/4/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdllongleggeddojiOptionsMap = {}, cdllongleggeddojiSeriesMap = {};
    var candleMediumHeight = 0;

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

        var lowerShadow = Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close)),
            upperShadow = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
            candleBodySize = Math.abs(candleOne_Low - candleOne_High),
            realBodySize = Math.abs(candleOne_Open - candleOne_Close),
            isOpenCloseAlmostSame = ((candleOne_Open === candleOne_Close) || (realBodySize < (candleBodySize * 0.10))),
            isLowerShadowLong = lowerShadow !== 0 && lowerShadow >= (candleBodySize * 0.40) && lowerShadow <= (candleBodySize * 0.80),
            isUpperShadowLong = upperShadow !== 0 && upperShadow >= (candleBodySize * 0.40) && upperShadow <= (candleBodySize * 0.80);


        var isBullishContinuation = isCandleTwo_Bearish//occurs at the bottom of downtrends.
                                    && candleBodySize > (candleMediumHeight * 2) //It should be long
                                    && isOpenCloseAlmostSame //vary small  body 
                                    && isUpperShadowLong //long and almost same shadows 
                                    && isLowerShadowLong;// long and almost same shadows

        var isBearishContinuation = isCandleTwo_Bullish //occurs at the top of uptrends\
                                    && candleBodySize > (candleMediumHeight * 2) //It should be long
                                    && isOpenCloseAlmostSame //vary small body 
                                    && isUpperShadowLong //long and almost same shadows
                                    && isLowerShadowLong;// long and almost same shadows.
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
                if (!H || H.Series.prototype.addCDLLONGLEGGEDDOJI) return;

                H.Series.prototype.addCDLLONGLEGGEDDOJI = function (cdllongleggeddojiOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdllongleggeddojiOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdllongleggeddojiOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLLONGLEGGEDDOJI series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLLONGLEGGEDDOJI data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdllongleggeddojiData = [];
                        for (var index = 1 ; index < data.length; index++) {

                            //Calculate CDLLONGLEGGEDDOJI - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdllongleggeddojiData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">LLD</span>',
                                    text: 'Long Legged Doji : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdllongleggeddojiData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">LLD</span>',
                                    text: 'Long Legged Doji : Bear'
                                });
                            }
                            //Calculate CDLLONGLEGGEDDOJI - end
                        };

                        var chart = this.chart;

                        cdllongleggeddojiOptionsMap[uniqueID] = cdllongleggeddojiOptions;

                        var series = this;
                        cdllongleggeddojiSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLLONGLEGGEDDOJI',
                            data: cdllongleggeddojiData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdllongleggeddojiSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdllongleggeddoji',
                            parentSeriesID: cdllongleggeddojiOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLLONGLEGGEDDOJI = function (uniqueID) {
                    var chart = this.chart;
                    cdllongleggeddojiOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdllongleggeddojiSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLLONGLEGGEDDOJI = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdllongleggeddojiOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdllongleggeddojieed, options, redraw, shift, animation) {

                    pcdllongleggeddojieed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdllongleggeddojiOptionsMap, this.options.id)) {
                        updateCDLLONGLEGGEDDOJISeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdllongleggeddojieed, options, redraw, animation) {

                    pcdllongleggeddojieed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdllongleggeddojiOptionsMap, this.series.options.id)) {
                        updateCDLLONGLEGGEDDOJISeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLLONGLEGGEDDOJISeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLLONGLEGGEDDOJI data point
                    for (var key in cdllongleggeddojiSeriesMap) {
                        if (cdllongleggeddojiSeriesMap[key] && cdllongleggeddojiSeriesMap[key].options && cdllongleggeddojiSeriesMap[key].options.data && cdllongleggeddojiSeriesMap[key].options.data.length > 0
                            && cdllongleggeddojiOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLLONGLEGGEDDOJI series. Add one more CDLLONGLEGGEDDOJI point
                            //Calculate CDLTAKURI data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLLONGLEGGEDDOJI - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLLONGLEGGEDDOJI - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">LLD</span>',
                                        text: 'Long Legged Doji : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">LLD</span>',
                                        text: 'Long Legged Doji : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdllongleggeddojiSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdllongleggeddojiSeriesMap[key].data[sIndx].x || cdllongleggeddojiSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdllongleggeddojiSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdllongleggeddojiSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdllongleggeddojiSeriesMap[key].data[whereToUpdate].remove();
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
