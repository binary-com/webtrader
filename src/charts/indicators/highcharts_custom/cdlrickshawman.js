/**
 * Created by Mahboob.M on 1/5/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlrickshawmanOptionsMap = {}, cdlrickshawmanSeriesMap = {};
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
                if (!H || H.Series.prototype.addCDLRICKSHAWMAN) return;

                H.Series.prototype.addCDLRICKSHAWMAN = function (cdlrickshawmanOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlrickshawmanOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlrickshawmanOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLRICKSHAWMAN series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLRICKSHAWMAN data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlrickshawmanData = [];
                        for (var index = 1 ; index < data.length; index++) {

                            //Calculate CDLRICKSHAWMAN - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlrickshawmanData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">RM</span>',
                                    text: 'Rickshaw Man : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlrickshawmanData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">RM</span>',
                                    text: 'Rickshaw Man : Bear'
                                });
                            }
                            //Calculate CDLRICKSHAWMAN - end
                        };

                        var chart = this.chart;

                        cdlrickshawmanOptionsMap[uniqueID] = cdlrickshawmanOptions;

                        var series = this;
                        cdlrickshawmanSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLRICKSHAWMAN',
                            data: cdlrickshawmanData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlrickshawmanSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlrickshawman',
                            parentSeriesID: cdlrickshawmanOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLRICKSHAWMAN = function (uniqueID) {
                    var chart = this.chart;
                    cdlrickshawmanOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlrickshawmanSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLRICKSHAWMAN = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlrickshawmanOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlrickshawmaneed, options, redraw, shift, animation) {

                    pcdlrickshawmaneed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlrickshawmanOptionsMap, this.options.id)) {
                        updateCDLRICKSHAWMANSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlrickshawmaneed, options, redraw, animation) {

                    pcdlrickshawmaneed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlrickshawmanOptionsMap, this.series.options.id)) {
                        updateCDLRICKSHAWMANSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLRICKSHAWMANSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLRICKSHAWMAN data point
                    for (var key in cdlrickshawmanSeriesMap) {
                        if (cdlrickshawmanSeriesMap[key] && cdlrickshawmanSeriesMap[key].options && cdlrickshawmanSeriesMap[key].options.data && cdlrickshawmanSeriesMap[key].options.data.length > 0
                            && cdlrickshawmanOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLRICKSHAWMAN series. Add one more CDLRICKSHAWMAN point
                            //Calculate CDLTAKURI data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLRICKSHAWMAN - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLRICKSHAWMAN - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">RM</span>',
                                        text: 'Rickshaw Man : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">RM</span>',
                                        text: 'Rickshaw Man : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlrickshawmanSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlrickshawmanSeriesMap[key].data[sIndx].x || cdlrickshawmanSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlrickshawmanSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlrickshawmanSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlrickshawmanSeriesMap[key].data[whereToUpdate].remove();
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
