/**
 * Created by Mahboob.M on 12/29/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdldarkcloudcoverOptionsMap = {}, cdldarkcloudcoverSeriesMap = {};

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var isBullishContinuation = false;//Piercing Pattern is bearish pattern ONLY

        var isBearishContinuation = isCandleTwo_Bullish
                                    && isCandleOne_Bearish && candleOne_Open > candleTwo_Close //Black candlestick must open above the previous close.
                                    && candleOne_Close < (Math.abs(candleTwo_Open + candleTwo_Close) / 2) //closes below the middle of day 1 bullish candlestick.
                                    && candleOne_Close > candleTwo_Open;//close within the price range of the previous day
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
                if (!H || H.Series.prototype.addCDLDARKCLOUDCOVER) return;

                H.Series.prototype.addCDLDARKCLOUDCOVER = function (cdldarkcloudcoverOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdldarkcloudcoverOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdldarkcloudcoverOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLDARKCLOUDCOVER series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLDARKCLOUDCOVER data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdldarkcloudcoverData = [];
                        for (var index = 1 ; index < data.length; index++) {

                            //Calculate CDLDARKCLOUDCOVER - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            //Piercing Pattern is bearish pattern ONLY
                            if (bull_bear.isBearishContinuation) {
                                cdldarkcloudcoverData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">DCC</span>',
                                    text: 'Dark Cloud Cover : Bear'
                                });
                            }
                            //Calculate CDLDARKCLOUDCOVER - end
                        };

                        var chart = this.chart;

                        cdldarkcloudcoverOptionsMap[uniqueID] = cdldarkcloudcoverOptions;

                        var series = this;
                        cdldarkcloudcoverSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLDARKCLOUDCOVER',
                            data: cdldarkcloudcoverData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdldarkcloudcoverSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdldarkcloudcover',
                            parentSeriesID: cdldarkcloudcoverOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLDARKCLOUDCOVER = function (uniqueID) {
                    var chart = this.chart;
                    cdldarkcloudcoverOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdldarkcloudcoverSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLDARKCLOUDCOVER = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdldarkcloudcoverOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdldarkcloudcovereed, options, redraw, shift, animation) {

                    pcdldarkcloudcovereed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdldarkcloudcoverOptionsMap, this.options.id)) {
                        updateCDLDARKCLOUDCOVERSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdldarkcloudcovereed, options, redraw, animation) {

                    pcdldarkcloudcovereed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdldarkcloudcoverOptionsMap, this.series.options.id)) {
                        updateCDLDARKCLOUDCOVERSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLDARKCLOUDCOVERSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLDARKCLOUDCOVER data point
                    for (var key in cdldarkcloudcoverSeriesMap) {
                        if (cdldarkcloudcoverSeriesMap[key] && cdldarkcloudcoverSeriesMap[key].options && cdldarkcloudcoverSeriesMap[key].options.data && cdldarkcloudcoverSeriesMap[key].options.data.length > 0
                            && cdldarkcloudcoverOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLDARKCLOUDCOVER series. Add one more CDLDARKCLOUDCOVER point
                            //Calculate CDLDARKCLOUDCOVER data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLDARKCLOUDCOVER - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLDARKCLOUDCOVER - end
                                var bullBearData = null;
                                //Piercing Pattern is bearish pattern ONLY
                                if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">DCC</span>',
                                        text: 'Dark Cloud Cover : Bear'
                                    }
                                };
                                //Calculate CDLDARKCLOUDCOVER - end


                                var whereToUpdate = -1;
                                for (var sIndx = cdldarkcloudcoverSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdldarkcloudcoverSeriesMap[key].data[sIndx].x || cdldarkcloudcoverSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdldarkcloudcoverSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdldarkcloudcoverSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdldarkcloudcoverSeriesMap[key].data[whereToUpdate].remove();
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
