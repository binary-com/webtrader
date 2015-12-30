/**
 * Created by Mahboob.M on 12/30/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlhangingmanOptionsMap = {}, cdlhangingmanSeriesMap = {};

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
			candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index);

        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
			isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    
        var perctDiff_openToClose = Math.abs((candleOne_Open - candleOne_Close) * 100.0 / candleOne_Open);
        var perctDiff_openToHigh = Math.abs((candleOne_Open - candleOne_High) * 100.0 / candleOne_Open);
        var perctDiff_closeToHigh = Math.abs((candleOne_Close - candleOne_High) * 100.0 / candleOne_Close);
        var body = Math.abs(candleOne_Open - candleOne_Close);
        var lowWick = Math.abs(candleOne_Low - Math.max(candleOne_Open, candleOne_Close));
        var isLowerShadowTwiceBody = lowWick >= (2.0 * body);
        var isOpenCloseHighAlmostSame = perctDiff_openToClose <= 1.0
                                        && perctDiff_openToHigh <= 1.0
                                        && perctDiff_closeToHigh <= 0.5;

        var isBullishContinuation = false;
        //Hammer is bearish only
        var isBearishContinuation = isCandleThree_Bullish //A bearish candlestick pattern that forms at the end of an uptrend
                                    && isCandleTwo_Bullish && candleTwo_Open > candleThree_Close //A bearish candlestick pattern that forms at the end of an uptrend
                                    && isOpenCloseHighAlmostSame //the open, high, and close are roughly the same price. means it has a small body.
                                    && isLowerShadowTwiceBody; //there is a long lower shadow, twice the length as the real body.

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
                if (!H || H.Series.prototype.addCDLHANGINGMAN) return;

                H.Series.prototype.addCDLHANGINGMAN = function (cdlhangingmanOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlhangingmanOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlhangingmanOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLHANGINGMAN series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLHANGINGMAN data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlhangingmanData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLHANGINGMAN - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            //Hammer is bearish only
                            if (bull_bear.isBearishContinuation) {
                                cdlhangingmanData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">HM</span>',
                                    text: 'Hanging Man : Bear'
                                });
                            };
                        };

                        var chart = this.chart;

                        cdlhangingmanOptionsMap[uniqueID] = cdlhangingmanOptions;

                        var series = this;
                        cdlhangingmanSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLHANGINGMAN',
                            data: cdlhangingmanData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlhangingmanSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlhangingman',
                            parentSeriesID: cdlhangingmanOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLHANGINGMAN = function (uniqueID) {
                    var chart = this.chart;
                    cdlhangingmanOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlhangingmanSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLHANGINGMAN = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlhangingmanOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlhangingmaneed, options, redraw, shift, animation) {

                    pcdlhangingmaneed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlhangingmanOptionsMap, this.options.id)) {
                        updateCDLHANGINGMANSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlhangingmaneed, options, redraw, animation) {

                    pcdlhangingmaneed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlhangingmanOptionsMap, this.series.options.id)) {
                        updateCDLHANGINGMANSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLHANGINGMANSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLHANGINGMAN data point
                    for (var key in cdlhangingmanSeriesMap) {
                        if (cdlhangingmanSeriesMap[key] && cdlhangingmanSeriesMap[key].options && cdlhangingmanSeriesMap[key].options.data && cdlhangingmanSeriesMap[key].options.data.length > 0
                            && cdlhangingmanOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLHANGINGMAN series. Add one more CDLHANGINGMAN point
                            //Calculate CDLHANGINGMAN data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLHANGINGMAN - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLHANGINGMAN - end
                                var bullBearData = null;
                                //Hammer is bearish only
                                if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">HM</span>',
                                        text: 'Hanging Man : Bear'
                                    }
                                };

                                var whereToUpdate = -1;
                                for (var sIndx = cdlhangingmanSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlhangingmanSeriesMap[key].data[sIndx].x || cdlhangingmanSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlhangingmanSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlhangingmanSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlhangingmanSeriesMap[key].data[whereToUpdate].remove();
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
