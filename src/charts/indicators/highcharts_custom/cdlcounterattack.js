/**
 * Created by Mahboob.M on 1/4/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlcounterattackOptionsMap = {}, cdlcounterattackSeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {

        var candleOne_Index = index;
        var candleTwo_Index = index - 1;

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
            candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
            isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

        var candleOneBody = Math.abs(candleOne_Close - candleOne_Open),
            candleTwoBody = Math.abs(candleTwo_Close - candleTwo_Open);

        var isBullishContinuation = isCandleTwo_Bearish && (candleTwoBody > candleMediumHeight)// bearish counterattack is a long black candle in an uptrend
                                    && isCandleOne_Bullish && (candleOneBody > candleMediumHeight) //followed by a long white candle.
                                    && (candleOne_Close <= (candleTwo_Close + (candleTwoBody * 0.1))) && (candleOne_Close >= (candleTwo_Close - (candleTwoBody * 0.1)))// Closing prices of both candles are at the same price level.

        var isBearishContinuation = isCandleTwo_Bullish && (candleTwoBody > candleMediumHeight)// bullish counterattack is a long white candle in an uptrend level.
                                    && isCandleOne_Bearish && (candleOneBody > candleMediumHeight) //followed by a long white candle.
                                    && (candleOne_Close <= (candleTwo_Close + (candleTwoBody * 0.1))) && (candleOne_Close >= (candleTwo_Close - (candleTwoBody * 0.1)))// Closing prices of both candles are at the same price level.

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
                if (!H || H.Series.prototype.addCDLCOUNTERATTACK) return;

                H.Series.prototype.addCDLCOUNTERATTACK = function (cdlcounterattackOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlcounterattackOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlcounterattackOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLCOUNTERATTACK series to the chart
                    var data = this.options.data || [];

                    if (data && data.length > 0) {

                        //Calculate CDLCOUNTERATTACK data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlcounterattackData = [];
                        for (var index = 1 ; index < data.length; index++) {

                            //Calculate CDLCOUNTERATTACK - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlcounterattackData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">CA</span>',
                                    text: 'Counterattack : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlcounterattackData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">CA</span>',
                                    text: 'Counterattack : Bear'
                                });
                            }
                            //Calculate CDLCOUNTERATTACK - end
                        };

                        var chart = this.chart;

                        cdlcounterattackOptionsMap[uniqueID] = cdlcounterattackOptions;

                        var series = this;
                        cdlcounterattackSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLCOUNTERATTACK',
                            data: cdlcounterattackData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlcounterattackSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlcounterattack',
                            parentSeriesID: cdlcounterattackOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLCOUNTERATTACK = function (uniqueID) {
                    var chart = this.chart;
                    cdlcounterattackOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlcounterattackSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLCOUNTERATTACK = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlcounterattackOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlcounterattackeed, options, redraw, shift, animation) {

                    pcdlcounterattackeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlcounterattackOptionsMap, this.options.id)) {
                        updateCDLCOUNTERATTACKSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlcounterattackeed, options, redraw, animation) {

                    pcdlcounterattackeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlcounterattackOptionsMap, this.series.options.id)) {
                        updateCDLCOUNTERATTACKSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLCOUNTERATTACKSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLCOUNTERATTACK data point
                    for (var key in cdlcounterattackSeriesMap) {
                        if (cdlcounterattackSeriesMap[key] && cdlcounterattackSeriesMap[key].options && cdlcounterattackSeriesMap[key].options.data && cdlcounterattackSeriesMap[key].options.data.length > 0
                            && cdlcounterattackOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLCOUNTERATTACK series. Add one more CDLCOUNTERATTACK point
                            //Calculate CDLCOUNTERATTACK data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLCOUNTERATTACK - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLCOUNTERATTACK - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">CA</span>',
                                        text: 'Counterattack : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">CA</span>',
                                        text: 'Counterattack : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlcounterattackSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlcounterattackSeriesMap[key].data[sIndx].x || cdlcounterattackSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlcounterattackSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlcounterattackSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlcounterattackSeriesMap[key].data[whereToUpdate].remove();
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
