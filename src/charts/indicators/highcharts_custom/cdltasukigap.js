/**
 * Created by Mahboob.M on 12/28/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdltasukigapOptionsMap = {}, cdltasukigapSeriesMap = {};

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

        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
			isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;


        var isBullishContinuation = isCandleThree_Bullish
                                    && isCandleTwo_Bullish && candleTwo_Open > candleThree_Close //gaps above 1st day
                                    && isCandleOne_Bearish && candleOne_Open > candleTwo_Open && candleOne_Open < candleTwo_Close //open inside the red 2day candle's real body.
                                    && candleOne_Close < candleTwo_Open && candleOne_Close > candleThree_Close;//closes within the gap between the first two bars. 

        var isBearishContinuation = isCandleThree_Bearish
                                    && isCandleTwo_Bearish && candleTwo_Open < candleThree_Close //gaps below 1st day
                                    && isCandleOne_Bullish && candleOne_Open > candleTwo_Close && candleOne_Open < candleTwo_Open //open inside the red candle's real body.
                                    && candleOne_Close < candleThree_Close && candleOne_Close > candleTwo_Open;//closes within the gap between the first two bars.

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
                if (!H || H.Series.prototype.addCDLTASUKIGAP) return;

                H.Series.prototype.addCDLTASUKIGAP = function (cdltasukigapOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdltasukigapOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdltasukigapOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLTASUKIGAP series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLTASUKIGAP data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdltasukigapData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLTASUKIGAP - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdltasukigapData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">TG</span>',
                                    text: 'Tasuki Gap : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdltasukigapData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">TG</span>',
                                    text: 'Tasuki Gap : Bear'
                                });
                            }
                            //Calculate CDLTASUKIGAP - end
                        };

                        var chart = this.chart;

                        cdltasukigapOptionsMap[uniqueID] = cdltasukigapOptions;

                        var series = this;
                        cdltasukigapSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLTASUKIGAP',
                            data: cdltasukigapData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdltasukigapSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdltasukigap',
                            parentSeriesID: cdltasukigapOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLTASUKIGAP = function (uniqueID) {
                    var chart = this.chart;
                    cdltasukigapOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdltasukigapSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLTASUKIGAP = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdltasukigapOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdltasukigapeed, options, redraw, shift, animation) {

                    pcdltasukigapeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdltasukigapOptionsMap, this.options.id)) {
                        updateCDLTASUKIGAPSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdltasukigapeed, options, redraw, animation) {

                    pcdltasukigapeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdltasukigapOptionsMap, this.series.options.id)) {
                        updateCDLTASUKIGAPSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLTASUKIGAPSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLUPSIDEGAP2CROWS data point
                    for (var key in cdltasukigapSeriesMap) {
                        if (cdltasukigapSeriesMap[key] && cdltasukigapSeriesMap[key].options && cdltasukigapSeriesMap[key].options.data && cdltasukigapSeriesMap[key].options.data.length > 0
                            && cdltasukigapOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLUPSIDEGAP2CROWS series. Add one more CDLUPSIDEGAP2CROWS point
                            //Calculate CDLUPSIDEGAP2CROWS data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLUPSIDEGAP2CROWS - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLUPSIDEGAP2CROWS - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">TG</span>',
                                        text: 'Upside Gap Two Crows : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">TG</span>',
                                        text: 'Upside Gap Two Crows : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdltasukigapSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdltasukigapSeriesMap[key].data[sIndx].x || cdltasukigapSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdltasukigapSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdltasukigapSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlshootingstarSeriesMap[key].data[whereToUpdate].remove();
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
