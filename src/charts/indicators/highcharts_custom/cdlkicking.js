/**
 * Created by Mahboob.M on 1/1/16.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlkickingOptionsMap = {}, cdlkickingSeriesMap = {};

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


        var isBullishContinuation = isCandleTwo_Bearish && candleTwo_Low === candleTwo_Close && candleTwo_High === candleTwo_Open  // a black or filled candlestick without any wicks (shadows)
                                   && isCandleOne_Bullish && candleOne_Low === candleOne_Open && candleOne_High === candleOne_Close //followed by a gap higher with a white or hollow candlestick that is also without wicks.
                                   && candleOne_Open > candleTwo_Open; //Gap up


        var isBearishContinuation = isCandleTwo_Bullish && candleTwo_Low === candleTwo_Open && candleTwo_High === candleTwo_Close  // a black or filled candlestick without any wicks (shadows)
                                   && isCandleOne_Bearish && candleOne_Low === candleOne_Close && candleOne_High === candleOne_Open //followed by a gap higher with a white or hollow candlestick that is also without wicks.
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
                if (!H || H.Series.prototype.addCDLKICKING) return;

                H.Series.prototype.addCDLKICKING = function (cdlkickingOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlkickingOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlkickingOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLKICKING series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLKICKING data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdlkickingData = [];
                        for (var index = 1; index < data.length; index++) {

                            //Calculate CDLKICKING - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            var isBullishContinuation = bull_bear.isBullishContinuation,
                                isBearishContinuation = bull_bear.isBearishContinuation;

                            if (isBullishContinuation) {
                                cdlkickingData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">KC</span>',
                                    text: 'Kicking : Bull'
                                });
                            }
                            if (isBearishContinuation) {
                                cdlkickingData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">KC</span>',
                                    text: 'Kicking : Bear'
                                });
                            }
                            //Calculate CDLKICKING - end

                        }

                        var chart = this.chart;

                        cdlkickingOptionsMap[uniqueID] = cdlkickingOptions;


                        var series = this;
                        cdlkickingSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLKICKING',
                            data: cdlkickingData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlkickingSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlkicking',
                            parentSeriesID: cdlkickingOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLKICKING = function (uniqueID) {
                    var chart = this.chart;
                    cdlkickingOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlkickingSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLKICKING = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlkickingOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlkickingeed, options, redraw, shift, animation) {

                    pcdlkickingeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlkickingOptionsMap, this.options.id)) {
                        updateCDLKICKINGSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlkickingeed, options, redraw, animation) {

                    pcdlkickingeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlkickingOptionsMap, this.series.options.id)) {
                        updateCDLKICKINGSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLKICKINGSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLKICKING data point
                    for (var key in cdlkickingSeriesMap) {
                        if (cdlkickingSeriesMap[key] && cdlkickingSeriesMap[key].options && cdlkickingSeriesMap[key].options.data && cdlkickingSeriesMap[key].options.data.length > 0
                            && cdlkickingOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLKICKING series. Add one more CDLKICKING point
                            //Calculate CDLKICKING data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdlkickingOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLKICKING - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLKICKING - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">KC</span>',
                                        text: 'Kicking : Bull'
                                    }
                                } else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">KC</span>',
                                        text: 'Kicking : Bear'
                                    }
                                }

                                var whereToUpdate = -1;
                                for (var sIndx = cdlkickingSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlkickingSeriesMap[key].data[sIndx].x || cdlkickingSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlkickingSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlkickingSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlkickingSeriesMap[key].data[whereToUpdate].remove();
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
