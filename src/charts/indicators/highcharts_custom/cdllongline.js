/**
 * Created by Mahboob.M on 12/31/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdllonglineOptionsMap = {}, cdllonglineSeriesMap = {};

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
                if (!H || H.Series.prototype.addCDLLONGLINE) return;

                H.Series.prototype.addCDLLONGLINE = function (cdllonglineOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdllonglineOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdllonglineOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLLONGLINE series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLLONGLINE data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdllonglineData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLLONGLINE - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdllonglineData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">LLC</span>',
                                    text: 'Long Line Candle : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdllonglineData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">LLC</span>',
                                    text: 'Long Line Candle : Bear'
                                });
                            }
                            //Calculate CDLLONGLINE - end
                        };

                        var chart = this.chart;

                        cdllonglineOptionsMap[uniqueID] = cdllonglineOptions;

                        var series = this;
                        cdllonglineSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLLONGLINE',
                            data: cdllonglineData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdllonglineSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdllongline',
                            parentSeriesID: cdllonglineOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLLONGLINE = function (uniqueID) {
                    var chart = this.chart;
                    cdllonglineOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdllonglineSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLLONGLINE = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdllonglineOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdllonglineeed, options, redraw, shift, animation) {

                    pcdllonglineeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdllonglineOptionsMap, this.options.id)) {
                        updateCDLLONGLINESeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdllonglineeed, options, redraw, animation) {

                    pcdllonglineeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdllonglineOptionsMap, this.series.options.id)) {
                        updateCDLLONGLINESeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLLONGLINESeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLLONGLINE data point
                    for (var key in cdllonglineSeriesMap) {
                        if (cdllonglineSeriesMap[key] && cdllonglineSeriesMap[key].options && cdllonglineSeriesMap[key].options.data && cdllonglineSeriesMap[key].options.data.length > 0
                            && cdllonglineOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLLONGLINE series. Add one more CDLLONGLINE point
                            //Calculate CDLLONGLINE data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLLONGLINE - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLLONGLINE - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">LLC</span>',
                                        text: 'Long Line Candle : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">LLC</span>',
                                        text: 'Long Line Candle : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdllonglineSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdllonglineSeriesMap[key].data[sIndx].x || cdllonglineSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdllonglineSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdllonglineSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdllonglineSeriesMap[key].data[whereToUpdate].remove();
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
