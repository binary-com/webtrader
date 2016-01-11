﻿/**
 * Created by Mahboob.M on 1/1/16.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlmarubozuOptionsMap = {}, cdlmarubozuSeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
        candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
        candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
        candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index)
        ;
        var isBearish = candleOne_Open > candleOne_Close;
        var isBullish = candleOne_Open < candleOne_Close;

        var lowerShadow = Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close)),
            upperShadow = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
            candleBodySize = Math.abs(candleOne_Low - candleOne_High),
            realBodySize = Math.abs(candleOne_Close - candleOne_Open),
            isLowerShadowShort = lowerShadow === 0 || lowerShadow <= (candleBodySize * 0.05),
            isUpperShadowShort = upperShadow === 0 || upperShadow <= (candleBodySize * 0.05);

        return {
            isBearishContinuation: isBearish && realBodySize > candleMediumHeight && isUpperShadowShort && isLowerShadowShort,
            isBullishContinuation: isBullish && realBodySize > candleMediumHeight && isUpperShadowShort && isLowerShadowShort
        };
    }

    return {
        init: function () {

            (function (H, $, indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addCDLMARUBOZU) return;

                H.Series.prototype.addCDLMARUBOZU = function (cdlmarubozuOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlmarubozuOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlmarubozuOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLMARUBOZU series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLMARUBOZU data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlmarubozuData = [];
                        for (var index = 0; index < data.length; index++) {

                            //Calculate CDLMARUBOZU - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            var isBullishContinuation = bull_bear.isBullishContinuation,
                                isBearishContinuation = bull_bear.isBearishContinuation;

                            if (isBullishContinuation) {
                                cdlmarubozuData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">MZ</span>',
                                    text: 'Marubozu : Bull'
                                });
                            }
                            if (isBearishContinuation) {
                                cdlmarubozuData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">MZ</span>',
                                    text: 'Marubozu : Bear'
                                });
                            }
                            //Calculate CDLMARUBOZU - end

                        }

                        var chart = this.chart;

                        cdlmarubozuOptionsMap[uniqueID] = cdlmarubozuOptions;


                        var series = this;
                        cdlmarubozuSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLMARUBOZU',
                            data: cdlmarubozuData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlmarubozuSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlmarubozu',
                            parentSeriesID: cdlmarubozuOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLMARUBOZU = function (uniqueID) {
                    var chart = this.chart;
                    cdlmarubozuOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlmarubozuSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLMARUBOZU = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlmarubozuOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlmarubozueed, options, redraw, shift, animation) {

                    pcdlmarubozueed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlmarubozuOptionsMap, this.options.id)) {
                        updateCDLMARUBOZUSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlmarubozueed, options, redraw, animation) {

                    pcdlmarubozueed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlmarubozuOptionsMap, this.series.options.id)) {
                        updateCDLMARUBOZUSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLMARUBOZUSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLMARUBOZU data point
                    for (var key in cdlmarubozuSeriesMap) {
                        if (cdlmarubozuSeriesMap[key] && cdlmarubozuSeriesMap[key].options && cdlmarubozuSeriesMap[key].options.data && cdlmarubozuSeriesMap[key].options.data.length > 0
                            && cdlmarubozuOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLMARUBOZU series. Add one more CDLMARUBOZU point
                            //Calculate CDLMARUBOZU data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdlmarubozuOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLMARUBOZU - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLMARUBOZU - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">MZ</span>',
                                        text: 'Marubozu : Bull'
                                    }
                                } else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">MZ</span>',
                                        text: 'Marubozu : Bear'
                                    }
                                }

                                var whereToUpdate = -1;
                                for (var sIndx = cdlmarubozuSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlmarubozuSeriesMap[key].data[sIndx].x || cdlmarubozuSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlmarubozuSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlmarubozuSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlmarubozuSeriesMap[key].data[whereToUpdate].remove();
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
