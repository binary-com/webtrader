/**
 * Created by Mahboob.M on 12/29/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlharamiOptionsMap = {}, cdlharamiSeriesMap = {};
    var candleMediumHeight = 0.0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var isBullishContinuation = isCandleTwo_Bearish && (Math.abs(candleTwo_Open - candleTwo_Close) > candleMediumHeight)//the first candlestick is upward
                                 && isCandleOne_Bullish && candleOne_Open > candleTwo_Close && candleOne_Close < candleTwo_Open// followed by a smaller candlestick whose body is located within the vertical range of the larger body
                                 && (Math.abs(candleOne_Open - candleOne_Close) < (Math.abs(candleTwo_Open - candleTwo_Close) * 0.60)); //Must be smaller than prevoius day

        var isBearishContinuation = isCandleTwo_Bullish && (Math.abs(candleTwo_Open - candleTwo_Close) > candleMediumHeight)// a large bullish green candle on Day 1
                                   && isCandleOne_Bearish && candleOne_Open < candleTwo_Close && candleOne_Close > candleTwo_Open// followed by a smaller candlestick whose body is located within the vertical range of the larger body
                                   && (Math.abs(candleOne_Open - candleOne_Close) < (Math.abs(candleTwo_Open - candleTwo_Close) * 0.60));//Must be smaller than prevoius day

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
                if (!H || H.Series.prototype.addCDLHARAMI) return;

                H.Series.prototype.addCDLHARAMI = function (cdlharamiOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlharamiOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlharamiOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLHARAMI series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLHARAMI data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlharamiData = [];
                        for (var index = 1 ; index < data.length; index++) {

                            //Calculate CDLHARAMI - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlharamiData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">HP</span>',
                                    text: 'Harami Pattern : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlharamiData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">HP</span>',
                                    text: 'Harami Pattern : Bear'
                                });
                            }
                            //Calculate CDLHARAMI - end
                        };

                        var chart = this.chart;

                        cdlharamiOptionsMap[uniqueID] = cdlharamiOptions;

                        var series = this;
                        cdlharamiSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLHARAMI',
                            data: cdlharamiData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlharamiSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlharami',
                            parentSeriesID: cdlharamiOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLHARAMI = function (uniqueID) {
                    var chart = this.chart;
                    cdlharamiOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlharamiSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLHARAMI = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlharamiOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlharamieed, options, redraw, shift, animation) {

                    pcdlharamieed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlharamiOptionsMap, this.options.id)) {
                        updateCDLHARAMISeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlharamieed, options, redraw, animation) {

                    pcdlharamieed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlharamiOptionsMap, this.series.options.id)) {
                        updateCDLHARAMISeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLHARAMISeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLHARAMI data point
                    for (var key in cdlharamiSeriesMap) {
                        if (cdlharamiSeriesMap[key] && cdlharamiSeriesMap[key].options && cdlharamiSeriesMap[key].options.data && cdlharamiSeriesMap[key].options.data.length > 0
                            && cdlharamiOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLHARAMI series. Add one more CDLHARAMI point
                            //Calculate CDLHARAMI data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLHARAMI - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLHARAMI - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">HP</span>',
                                        text: 'Harami Pattern : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">HP</span>',
                                        text: 'Harami Pattern : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlharamiSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlharamiSeriesMap[key].data[sIndx].x || cdlharamiSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlharamiSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlharamiSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlharamiSeriesMap[key].data[whereToUpdate].remove();
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
