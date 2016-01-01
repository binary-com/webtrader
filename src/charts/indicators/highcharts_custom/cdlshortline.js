/**
 * Created by Mahboob.M on 12/31/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlshortlineOptionsMap = {}, cdlshortlineSeriesMap = {};

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
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;


        var isBullishContinuation = false;

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
                if (!H || H.Series.prototype.addCDLSHORTLINE) return;

                H.Series.prototype.addCDLSHORTLINE = function (cdlshortlineOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlshortlineOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlshortlineOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLSHORTLINE series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLSHORTLINE data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlshortlineData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLSHORTLINE - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlshortlineData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">SLC</span>',
                                    text: 'Short Line Candle : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlshortlineData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">SLC</span>',
                                    text: 'Short Line Candle : Bear'
                                });
                            }
                            //Calculate CDLSHORTLINE - end
                        };

                        var chart = this.chart;

                        cdlshortlineOptionsMap[uniqueID] = cdlshortlineOptions;

                        var series = this;
                        cdlshortlineSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLSHORTLINE',
                            data: cdlshortlineData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlshortlineSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlshortline',
                            parentSeriesID: cdlshortlineOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLSHORTLINE = function (uniqueID) {
                    var chart = this.chart;
                    cdlshortlineOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlshortlineSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLSHORTLINE = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlshortlineOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlshortlineeed, options, redraw, shift, animation) {

                    pcdlshortlineeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlshortlineOptionsMap, this.options.id)) {
                        updateCDLSHORTLINESeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlshortlineeed, options, redraw, animation) {

                    pcdlshortlineeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlshortlineOptionsMap, this.series.options.id)) {
                        updateCDLSHORTLINESeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLSHORTLINESeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLSHORTLINE data point
                    for (var key in cdlshortlineSeriesMap) {
                        if (cdlshortlineSeriesMap[key] && cdlshortlineSeriesMap[key].options && cdlshortlineSeriesMap[key].options.data && cdlshortlineSeriesMap[key].options.data.length > 0
                            && cdlshortlineOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLSHORTLINE series. Add one more CDLSHORTLINE point
                            //Calculate CDLSHORTLINE data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLSHORTLINE - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLSHORTLINE - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">SLC</span>',
                                        text: 'Short Line Candle : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">SLC</span>',
                                        text: 'Short Line Candle : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlshortlineSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlshortlineSeriesMap[key].data[sIndx].x || cdlshortlineSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlshortlineSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlshortlineSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlshortlineSeriesMap[key].data[whereToUpdate].remove();
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
