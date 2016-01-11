/**
 * Created by Mahboob.M on 12/29/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlgapsidesidewhiteOptionsMap = {}, cdlgapsidesidewhiteSeriesMap = {};

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


        var isBullishContinuation = isCandleThree_Bullish  //the first candlestick is upward 
                                    && isCandleTwo_Bullish && candleTwo_Open > candleThree_Close //followed by another upward that opens above  the first (gap up), 
                                    && isCandleOne_Bullish && candleOne_Open > candleThree_Close && candleOne_Open < candleTwo_Close// followed by a third upward candlestick that opens below the close of the second (gap down)
                                    && candleOne_Close <= (candleTwo_Close + (Math.abs(candleTwo_Close - candleTwo_Open) * 0.10));

        var isBearishContinuation = isCandleThree_Bearish  //the first candlestick is downward
                                    && isCandleTwo_Bullish && candleTwo_Close < candleThree_Close//followed by an upward candlestick that opens below the  first one (gap down),
                                    && isCandleOne_Bullish && candleOne_Close < candleThree_Close && candleOne_Open < candleTwo_Close// followed by an upward candlestick that opens below the close of the second one
                                    && candleOne_Close <= (candleTwo_Close + (Math.abs(candleTwo_Close - candleTwo_Open) * 0.10));

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
                if (!H || H.Series.prototype.addCDLGAPSIDESIDEWHITE) return;

                H.Series.prototype.addCDLGAPSIDESIDEWHITE = function (cdlgapsidesidewhiteOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlgapsidesidewhiteOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlgapsidesidewhiteOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLGAPSIDESIDEWHITE series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLGAPSIDESIDEWHITE data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlgapsidesidewhiteData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLGAPSIDESIDEWHITE - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlgapsidesidewhiteData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">SSWL</span>',
                                    text: 'Up/Down-Gap Side-By-Side White Lines : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlgapsidesidewhiteData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">SSWL</span>',
                                    text: 'Up/Down-Gap Side-By-Side White Lines : Bear'
                                });
                            }
                            //Calculate CDLGAPSIDESIDEWHITE - end
                        };

                        var chart = this.chart;

                        cdlgapsidesidewhiteOptionsMap[uniqueID] = cdlgapsidesidewhiteOptions;

                        var series = this;
                        cdlgapsidesidewhiteSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLGAPSIDESIDEWHITE',
                            data: cdlgapsidesidewhiteData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlgapsidesidewhiteSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlgapsidesidewhite',
                            parentSeriesID: cdlgapsidesidewhiteOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLGAPSIDESIDEWHITE = function (uniqueID) {
                    var chart = this.chart;
                    cdlgapsidesidewhiteOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlgapsidesidewhiteSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLGAPSIDESIDEWHITE = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlgapsidesidewhiteOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlgapsidesidewhiteeed, options, redraw, shift, animation) {

                    pcdlgapsidesidewhiteeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlgapsidesidewhiteOptionsMap, this.options.id)) {
                        updateCDLGAPSIDESIDEWHITESeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlgapsidesidewhiteeed, options, redraw, animation) {

                    pcdlgapsidesidewhiteeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlgapsidesidewhiteOptionsMap, this.series.options.id)) {
                        updateCDLGAPSIDESIDEWHITESeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLGAPSIDESIDEWHITESeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLGAPSIDESIDEWHITE data point
                    for (var key in cdlgapsidesidewhiteSeriesMap) {
                        if (cdlgapsidesidewhiteSeriesMap[key] && cdlgapsidesidewhiteSeriesMap[key].options && cdlgapsidesidewhiteSeriesMap[key].options.data && cdlgapsidesidewhiteSeriesMap[key].options.data.length > 0
                            && cdlgapsidesidewhiteOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLGAPSIDESIDEWHITE series. Add one more CDLGAPSIDESIDEWHITE point
                            //Calculate CDLGAPSIDESIDEWHITE data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLGAPSIDESIDEWHITE - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLGAPSIDESIDEWHITE - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">SSWL</span>',
                                        text: 'Up/Down-Gap Side-By-Side White Lines : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">SSWL</span>',
                                        text: 'Up/Down-Gap Side-By-Side White Lines : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlgapsidesidewhiteSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlgapsidesidewhiteSeriesMap[key].data[sIndx].x || cdlgapsidesidewhiteSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlgapsidesidewhiteSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlgapsidesidewhiteSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlgapsidesidewhiteSeriesMap[key].data[whereToUpdate].remove();
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
