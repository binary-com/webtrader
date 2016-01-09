/**
 * Created by Mahboob.M on 12/31/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlhomingpigeonOptionsMap = {}, cdlhomingpigeonSeriesMap = {};
    var candleMediumHeight = 0.0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
            candleTwo_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleTwo_Index),
            candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
            candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index);

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var candleOneBody = Math.abs(candleOne_Close - candleOne_Open);

        //is bullish only
        var isBullishContinuation = isCandleTwo_Bearish // First candle is a long black candle.
                                    && isCandleOne_Bearish && (candleOneBody >= candleMediumHeight)
                                    && candleOne_Low > candleTwo_Low && candleOne_Close > candleTwo_Close // Second candle is an inside bar, which is also a black candle. Second candle closes inside the body of the first candle.
                                    && candleOne_High < candleTwo_High && candleOne_Open < candleTwo_Open;

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
                if (!H || H.Series.prototype.addCDLHOMINGPIGEON) return;

                H.Series.prototype.addCDLHOMINGPIGEON = function (cdlhomingpigeonOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlhomingpigeonOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlhomingpigeonOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLHOMINGPIGEON series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLHOMINGPIGEON data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlhomingpigeonData = [];
                        for (var index = 1 ; index < data.length; index++) {

                            //Calculate CDLHOMINGPIGEON - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlhomingpigeonData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">HP</span>',
                                    text: 'Homing Pigeon : Bull'
                                });
                            };
                            //Calculate CDLHOMINGPIGEON - end
                        };

                        var chart = this.chart;

                        cdlhomingpigeonOptionsMap[uniqueID] = cdlhomingpigeonOptions;

                        var series = this;
                        cdlhomingpigeonSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLHOMINGPIGEON',
                            data: cdlhomingpigeonData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlhomingpigeonSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlhomingpigeon',
                            parentSeriesID: cdlhomingpigeonOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLHOMINGPIGEON = function (uniqueID) {
                    var chart = this.chart;
                    cdlhomingpigeonOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlhomingpigeonSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLHOMINGPIGEON = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlhomingpigeonOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlhomingpigeoneed, options, redraw, shift, animation) {

                    pcdlhomingpigeoneed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlhomingpigeonOptionsMap, this.options.id)) {
                        updateCDLHOMINGPIGEONSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlhomingpigeoneed, options, redraw, animation) {

                    pcdlhomingpigeoneed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlhomingpigeonOptionsMap, this.series.options.id)) {
                        updateCDLHOMINGPIGEONSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLHOMINGPIGEONSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLHOMINGPIGEON data point
                    for (var key in cdlhomingpigeonSeriesMap) {
                        if (cdlhomingpigeonSeriesMap[key] && cdlhomingpigeonSeriesMap[key].options && cdlhomingpigeonSeriesMap[key].options.data && cdlhomingpigeonSeriesMap[key].options.data.length > 0
                            && cdlhomingpigeonOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLHOMINGPIGEON series. Add one more CDLHOMINGPIGEON point
                            //Calculate CDLHOMINGPIGEON data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLHOMINGPIGEON - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLHOMINGPIGEON - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">HP</span>',
                                        text: 'Homing Pigeon : Bull'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlhomingpigeonSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlhomingpigeonSeriesMap[key].data[sIndx].x || cdlhomingpigeonSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlhomingpigeonSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlhomingpigeonSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlhomingpigeonSeriesMap[key].data[whereToUpdate].remove();
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
