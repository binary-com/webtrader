/**
 * Created by Mahboob.M on 1/1/16.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlkickingbylengthOptionsMap = {}, cdlkickingbylengthSeriesMap = {};
    var candleMediumHeight = 0;

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

        var candleOneBody = Math.abs(candleOne_Close - candleOne_Open);
        var candleTwoBody = Math.abs(candleTwo_Close - candleTwo_Open);

        var isBullishContinuation = isCandleTwo_Bearish && (candleTwoBody > candleMediumHeight) && (candleTwo_Low === candleTwo_Close) && (candleTwo_High === candleTwo_Open)  // a black or filled candlestick without any wicks (shadows)
                                   && isCandleOne_Bullish && (candleOneBody > candleMediumHeight) && (candleOne_Low === candleOne_Open) && (candleOne_High === candleOne_Close) //followed by a gap higher with a white or hollow candlestick that is also without wicks.
                                   && candleOne_Open > candleTwo_Open; //Gap up


        var isBearishContinuation = isCandleTwo_Bullish && (candleTwoBody > candleMediumHeight) && (candleTwo_Low === candleTwo_Open) && (candleTwo_High === candleTwo_Close)  // a black or filled candlestick without any wicks (shadows)
                                   && isCandleOne_Bearish && (candleOneBody > candleMediumHeight) && (candleOne_Low === candleOne_Close) && (candleOne_High === candleOne_Open) //followed by a gap higher with a white or hollow candlestick that is also without wicks.
                                   && candleOne_Open < candleTwo_Open; //Gap down

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
                if (!H || H.Series.prototype.addCDLKICKINGBYLENGTH) return;

                H.Series.prototype.addCDLKICKINGBYLENGTH = function (cdlkickingbylengthOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlkickingbylengthOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlkickingbylengthOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLKICKING series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLKICKINGBYLENGTHBYLENGTH data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlkickingbylengthData = [];
                        for (var index = 1; index < data.length; index++) {

                            //Calculate CDLKICKINGBYLENGTH - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            var isBullishContinuation = bull_bear.isBullishContinuation,
                                isBearishContinuation = bull_bear.isBearishContinuation;

                            if (isBullishContinuation) {
                                cdlkickingbylengthData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">KCWLM</span>',
                                    text: 'Kicking (longer marubozu) : Bull'
                                });
                            }
                            if (isBearishContinuation) {
                                cdlkickingbylengthData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">KCWLM</span>',
                                    text: 'Kicking (longer marubozu) : Bear'
                                });
                            }
                            //Calculate CDLKICKINGBYLENGTH - end

                        }

                        var chart = this.chart;

                        cdlkickingbylengthOptionsMap[uniqueID] = cdlkickingbylengthOptions;


                        var series = this;
                        cdlkickingbylengthSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLKICKINGBYLENGTH',
                            data: cdlkickingbylengthData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlkickingbylengthSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlkickingbylength',
                            parentSeriesID: cdlkickingbylengthOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLKICKINGBYLENGTH = function (uniqueID) {
                    var chart = this.chart;
                    cdlkickingbylengthOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlkickingbylengthSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLKICKINGBYLENGTH = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlkickingbylengthOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlkickingbylengtheed, options, redraw, shift, animation) {

                    pcdlkickingbylengtheed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlkickingbylengthOptionsMap, this.options.id)) {
                        updateCDLKICKINGBYLENGTHSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlkickingbylengtheed, options, redraw, animation) {

                    pcdlkickingbylengtheed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlkickingbylengthOptionsMap, this.series.options.id)) {
                        updateCDLKICKINGBYLENGTHSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLKICKINGBYLENGTHSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLKICKINGBYLENGTH data point
                    for (var key in cdlkickingbylengthSeriesMap) {
                        if (cdlkickingbylengthSeriesMap[key] && cdlkickingbylengthSeriesMap[key].options && cdlkickingbylengthSeriesMap[key].options.data && cdlkickingbylengthSeriesMap[key].options.data.length > 0
                            && cdlkickingbylengthOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLKICKINGBYLENGTH series. Add one more CDLKICKINGBYLENGTH point
                            //Calculate CDLKICKINGBYLENGTH data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdlkickingbylengthOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLKICKINGBYLENGTH - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLKICKINGBYLENGTH - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">KCWLM</span>',
                                        text: 'Kicking (longer marubozu) : Bull'
                                    }
                                } else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">KCWLM</span>',
                                        text: 'Kicking (longer marubozu) : Bear'
                                    }
                                }

                                var whereToUpdate = -1;
                                for (var sIndx = cdlkickingbylengthSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlkickingbylengthSeriesMap[key].data[sIndx].x || cdlkickingbylengthSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlkickingbylengthSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlkickingbylengthSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlkickingbylengthSeriesMap[key].data[whereToUpdate].remove();
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
