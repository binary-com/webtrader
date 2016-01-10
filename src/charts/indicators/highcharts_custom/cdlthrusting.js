/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlthrustingOptionsMap = {}, cdlthrustingSeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
            candleTwo_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleTwo_Index),
            candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
            candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var isBearishContinuation = isCandleTwo_Bearish && (Math.abs(candleTwo_Close - candleTwo_Open) >= candleMediumHeight) //day-one of the pattern is a long red candle continuing the trend
                                    && isCandleOne_Bullish && (candleOne_Open < candleTwo_Close) //Day-two is a blue day
					                && candleOne_Close <= (candleTwo_Close + (Math.abs(candleTwo_Open - candleTwo_Close) / 2)) // closes into the body (below midpoint) of the previous day
                                    && (candleOne_Close >= candleTwo_Close);

        var isBullishContinuation = isCandleTwo_Bullish && (Math.abs(candleTwo_Close - candleTwo_Open) >= candleMediumHeight)////day-one of the pattern is a long blue candle
                                    && isCandleOne_Bearish && (candleOne_Open > candleTwo_Close) //Day-two is a red day
                                    && candleOne_Close >= (candleTwo_Close - (Math.abs(candleTwo_Open - candleTwo_Close) / 2)) // closes into the body (above midpoint) of the previous day
                                    && (candleOne_Close <= candleTwo_Close);

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
                if (!H || H.Series.prototype.addCDLTHRUSTING) return;

                H.Series.prototype.addCDLTHRUSTING = function (cdlthrustingOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlthrustingOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlthrustingOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLTHRUSTING series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLTHRUSTING data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlthrustingData = [];
                        for (var index = 1; index < data.length; index++) {

                            //Calculate CDLTHRUSTING - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            var isBullishContinuation = bull_bear.isBullishContinuation,
                                isBearishContinuation = bull_bear.isBearishContinuation;

                            if (isBullishContinuation) {
                                cdlthrustingData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">TP</span>',
                                    text: 'Thrusting Pattern : Bull'
                                });
                            }
                            if (isBearishContinuation) {
                                cdlthrustingData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">TP</span>',
                                    text: 'Thrusting Pattern : Bear'
                                });
                            }
                            //Calculate CDLTHRUSTING - end

                        }

                        var chart = this.chart;

                        cdlthrustingOptionsMap[uniqueID] = cdlthrustingOptions;


                        var series = this;
                        cdlthrustingSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLTHRUSTING',
                            data: cdlthrustingData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlthrustingSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlthrusting',
                            parentSeriesID: cdlthrustingOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLTHRUSTING = function (uniqueID) {
                    var chart = this.chart;
                    cdlthrustingOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlthrustingSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLTHRUSTING = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlthrustingOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlthrustingeed, options, redraw, shift, animation) {

                    pcdlthrustingeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlthrustingOptionsMap, this.options.id)) {
                        updateCDLTHRUSTINGSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlthrustingeed, options, redraw, animation) {

                    pcdlthrustingeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlthrustingOptionsMap, this.series.options.id)) {
                        updateCDLTHRUSTINGSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLTHRUSTINGSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLTHRUSTING data point
                    for (var key in cdlthrustingSeriesMap) {
                        if (cdlthrustingSeriesMap[key] && cdlthrustingSeriesMap[key].options && cdlthrustingSeriesMap[key].options.data && cdlthrustingSeriesMap[key].options.data.length > 0
                            && cdlthrustingOptionsMap[key].parentSeriesID == series.options.id
                            && cdlthrustingSeriesMap[key].chart === chart
                        ) {
                            //This is CDLTHRUSTING series. Add one more CDLTHRUSTING point
                            //Calculate CDLTHRUSTING data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdlthrustingOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLTHRUSTING - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLTHRUSTING - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">TP</span>',
                                        text: 'Thrusting Pattern : Bull'
                                    }
                                } else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">TP</span>',
                                        text: 'Thrusting Pattern : Bear'
                                    }
                                }

                                var whereToUpdate = -1;
                                for (var sIndx = cdlthrustingSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlthrustingSeriesMap[key].data[sIndx].x || cdlthrustingSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlthrustingSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlthrustingSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlthrustingSeriesMap[key].data[whereToUpdate].remove();
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
