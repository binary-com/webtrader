/**
 * Created by Mahboob.M on 1/1/16.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlseparatinglinesOptionsMap = {}, cdlseparatinglinesSeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
            candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
            candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
            isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var candleTwoBody = Math.abs(candleTwo_Close - candleTwo_Open);

        var isBullishContinuation = (candleOne_Open > Math.max(candleThree_Open, candleThree_Close)) //After an uptrend
                                   && isCandleTwo_Bearish && (candleTwoBody > candleMediumHeight) // 1st day is a long red day
                                   && isCandleOne_Bullish && candleOne_Open === candleTwo_Open; //2nd day is a white day that opens at the opening price of the 1st day.


        var isBearishContinuation = (candleOne_Open < Math.min(candleThree_Open, candleThree_Close)) //After an downtrend
                                   && isCandleTwo_Bullish && (candleTwoBody > candleMediumHeight)  // 1st day is a long white day
                                   && isCandleOne_Bearish && candleOne_Open === candleTwo_Open; //2nd day is a red day that opens at the opening price of the 1st day.


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
                if (!H || H.Series.prototype.addCDLSEPARATINGLINES) return;

                H.Series.prototype.addCDLSEPARATINGLINES = function (cdlseparatinglinesOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlseparatinglinesOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlseparatinglinesOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLSEPARATINGLINES series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLSEPARATINGLINES data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlseparatinglinesData = [];
                        for (var index = 2; index < data.length; index++) {

                            //Calculate CDLSEPARATINGLINES - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            var isBullishContinuation = bull_bear.isBullishContinuation,
                                isBearishContinuation = bull_bear.isBearishContinuation;

                            if (isBullishContinuation) {
                                cdlseparatinglinesData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">SL</span>',
                                    text: 'Separating Lines : Bull'
                                });
                            }
                            if (isBearishContinuation) {
                                cdlseparatinglinesData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">SL</span>',
                                    text: 'Separating Lines : Bear'
                                });
                            }
                            //Calculate CDLSEPARATINGLINES - end

                        }

                        var chart = this.chart;

                        cdlseparatinglinesOptionsMap[uniqueID] = cdlseparatinglinesOptions;


                        var series = this;
                        cdlseparatinglinesSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLSEPARATINGLINES',
                            data: cdlseparatinglinesData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlseparatinglinesSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlseparatinglines',
                            parentSeriesID: cdlseparatinglinesOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLSEPARATINGLINES = function (uniqueID) {
                    var chart = this.chart;
                    cdlseparatinglinesOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlseparatinglinesSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLSEPARATINGLINES = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlseparatinglinesOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlseparatinglineseed, options, redraw, shift, animation) {

                    pcdlseparatinglineseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlseparatinglinesOptionsMap, this.options.id)) {
                        updateCDLSEPARATINGLINESSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlseparatinglineseed, options, redraw, animation) {

                    pcdlseparatinglineseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlseparatinglinesOptionsMap, this.series.options.id)) {
                        updateCDLSEPARATINGLINESSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLSEPARATINGLINESSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLSEPARATINGLINES data point
                    for (var key in cdlseparatinglinesSeriesMap) {
                        if (cdlseparatinglinesSeriesMap[key] && cdlseparatinglinesSeriesMap[key].options && cdlseparatinglinesSeriesMap[key].options.data && cdlseparatinglinesSeriesMap[key].options.data.length > 0
                            && cdlseparatinglinesOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLSEPARATINGLINES series. Add one more CDLSEPARATINGLINES point
                            //Calculate CDLSEPARATINGLINES data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdlseparatinglinesOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLSEPARATINGLINES - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLSEPARATINGLINES - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">SL</span>',
                                        text: 'Separating Lines : Bull'
                                    }
                                } else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">SL</span>',
                                        text: 'Separating Lines : Bear'
                                    }
                                }

                                var whereToUpdate = -1;
                                for (var sIndx = cdlseparatinglinesSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlseparatinglinesSeriesMap[key].data[sIndx].x || cdlseparatinglinesSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlseparatinglinesSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlseparatinglinesSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlseparatinglinesSeriesMap[key].data[whereToUpdate].remove();
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
