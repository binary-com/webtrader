/**
 * Created by Mahboob.M on 12/29/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdltakuriOptionsMap = {}, cdltakuriSeriesMap = {};

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
			candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index);

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

        var lowWick = Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close)),
            highWick = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
            candleBodySize = Math.abs(candleOne_Low - candleOne_High),
            realBodySize = Math.abs(candleOne_Open - candleOne_Close),
            isOpenCloseHighAlmostSame = ((candleOne_Open === candleOne_Close) || (realBodySize < (candleBodySize * 0.20)))
             && ((candleOne_High === Math.max(candleOne_Open, candleOne_Close)) || (highWick < (candleBodySize * 0.20))),
            isLowerShadowLong = (lowWick >= (candleBodySize * 0.80));

        var isBullishContinuation = isCandleTwo_Bearish //occurs at the bottom of downtrends.
                                    && isOpenCloseHighAlmostSame //the open, high, and close are the same or about the same price
                                    && isLowerShadowLong;// with a Lower Shadow that is long at least three times the Real Body of the Candle; 

        var isBearishContinuation = isCandleTwo_Bullish //occurs at the top of uptrends
                                    && isOpenCloseHighAlmostSame //the open, high, and close are the same or about the same price
                                    && isLowerShadowLong;// with a Lower Shadow that is long at least three times the Real Body of the Candle; 
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
                if (!H || H.Series.prototype.addCDLTAKURI) return;

                H.Series.prototype.addCDLTAKURI = function (cdltakuriOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdltakuriOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdltakuriOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLTAKURI series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLTAKURI data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdltakuriData = [];
                        for (var index = 1 ; index < data.length; index++) {

                            //Calculate CDLTAKURI - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdltakuriData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">TK</span>',
                                    text: 'Takuri : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdltakuriData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">TK</span>',
                                    text: 'Takuri : Bear'
                                });
                            }
                            //Calculate CDLTAKURI - end
                        };

                        var chart = this.chart;

                        cdltakuriOptionsMap[uniqueID] = cdltakuriOptions;

                        var series = this;
                        cdltakuriSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLTAKURI',
                            data: cdltakuriData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdltakuriSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdltakuri',
                            parentSeriesID: cdltakuriOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLTAKURI = function (uniqueID) {
                    var chart = this.chart;
                    cdltakuriOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdltakuriSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLTAKURI = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdltakuriOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdltakurieed, options, redraw, shift, animation) {

                    pcdltakurieed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdltakuriOptionsMap, this.options.id)) {
                        updateCDLTAKURISeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdltakurieed, options, redraw, animation) {

                    pcdltakurieed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdltakuriOptionsMap, this.series.options.id)) {
                        updateCDLTAKURISeries.call(this.series, this.x, true);
                    }

                }); 
                

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLTAKURISeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLTAKURI data point
                    for (var key in cdltakuriSeriesMap) {
                        if (cdltakuriSeriesMap[key] && cdltakuriSeriesMap[key].options && cdltakuriSeriesMap[key].options.data && cdltakuriSeriesMap[key].options.data.length > 0
                            && cdltakuriOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLTAKURI series. Add one more CDLTAKURI point
                            //Calculate CDLTAKURI data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLTAKURI - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLTAKURI - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">TK</span>',
                                        text: 'Takuri : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">TK</span>',
                                        text: 'Takuri : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdltakuriSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdltakuriSeriesMap[key].data[sIndx].x || cdltakuriSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdltakuriSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdltakuriSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdltakuriSeriesMap[key].data[whereToUpdate].remove();
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
