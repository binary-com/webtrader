/**
 * Created by Mahboob.M on 1/2/16.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlspinningtopOptionsMap = {}, cdlspinningtopSeriesMap = {};

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index)
            candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index);


        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
            isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
            isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var upperShadow = candleOne_High - Math.max(candleOne_Open, candleOne_Close),
            lowerShadow = Math.min(candleOne_Open, candleOne_Close) - candleOne_Low,
            candleBodySize = Math.abs(candleOne_High - candleOne_Low),
            realBodySize = Math.abs(candleOne_Open - candleOne_Close);


        var isBullishContinuation = isCandleTwo_Bearish
                                  && isCandleOne_Bullish && (realBodySize <= (candleBodySize * 0.30)) //It is not too different to a Doji in structure, but rather than a flat body it has a small body between an open and close price
                                  && (upperShadow > realBodySize) && (upperShadow < (candleBodySize * 0.50)) // The spinning top is composed of a small body with small upper and lower shadows.
                                  && (lowerShadow > realBodySize) && (lowerShadow < (candleBodySize * 0.50));
                                  

        var isBearishContinuation = isCandleTwo_Bullish
                                  && isCandleOne_Bearish && (realBodySize <= (candleBodySize * 0.30)) //It is not too different to a Doji in structure, but rather than a flat body it has a small body between an open and close price
                                  && (upperShadow > realBodySize) && (upperShadow < (candleBodySize * 0.50)) // The spinning top is composed of a small body with small upper and lower shadows.
                                  && (lowerShadow > realBodySize) && (lowerShadow < (candleBodySize * 0.50));

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
                if (!H || H.Series.prototype.addCDLSPINNINGTOP) return;

                H.Series.prototype.addCDLSPINNINGTOP = function (cdlspinningtopOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlspinningtopOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlspinningtopOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLSPINNINGTOP series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLSPINNINGTOP data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdlspinningtopData = [];
                        for (var index = 1; index < data.length; index++) {

                            //Calculate CDLSPINNINGTOP - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            var isBullishContinuation = bull_bear.isBullishContinuation,
                                isBearishContinuation = bull_bear.isBearishContinuation;

                            if (isBullishContinuation) {
                                cdlspinningtopData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">ST</span>',
                                    text: 'Spinning Top : Bull'
                                });
                            }
                            if (isBearishContinuation) {
                                cdlspinningtopData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">ST</span>',
                                    text: 'Spinning Top : Bear'
                                });
                            }
                            //Calculate CDLSPINNINGTOP - end

                        }

                        var chart = this.chart;

                        cdlspinningtopOptionsMap[uniqueID] = cdlspinningtopOptions;


                        var series = this;
                        cdlspinningtopSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLSPINNINGTOP',
                            data: cdlspinningtopData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlspinningtopSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlspinningtop',
                            parentSeriesID: cdlspinningtopOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLSPINNINGTOP = function (uniqueID) {
                    var chart = this.chart;
                    cdlspinningtopOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlspinningtopSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLSPINNINGTOP = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlspinningtopOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlspinningtopeed, options, redraw, shift, animation) {

                    pcdlspinningtopeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlspinningtopOptionsMap, this.options.id)) {
                        updateCDLSPINNINGTOPSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlspinningtopeed, options, redraw, animation) {

                    pcdlspinningtopeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlspinningtopOptionsMap, this.series.options.id)) {
                        updateCDLSPINNINGTOPSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLSPINNINGTOPSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLSPINNINGTOP data point
                    for (var key in cdlspinningtopSeriesMap) {
                        if (cdlspinningtopSeriesMap[key] && cdlspinningtopSeriesMap[key].options && cdlspinningtopSeriesMap[key].options.data && cdlspinningtopSeriesMap[key].options.data.length > 0
                            && cdlspinningtopOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLSPINNINGTOP series. Add one more CDLSPINNINGTOP point
                            //Calculate CDLSPINNINGTOP data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdlspinningtopOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLSPINNINGTOP - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLSPINNINGTOP - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">ST</span>',
                                        text: 'Spinning Top : Bull'
                                    }
                                } else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">ST</span>',
                                        text: 'Spinning Top : Bear'
                                    }
                                }

                                var whereToUpdate = -1;
                                for (var sIndx = cdlspinningtopSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlspinningtopSeriesMap[key].data[sIndx].x || cdlspinningtopSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlspinningtopSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlspinningtopSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlspinningtopSeriesMap[key].data[whereToUpdate].remove();
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
