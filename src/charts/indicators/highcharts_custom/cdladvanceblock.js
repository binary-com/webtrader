/**
 * Created by Mahboob.M on 1/4/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdladvanceblockOptionsMap = {}, cdladvanceblockSeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index),
            candleThree_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
            candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
            candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index);

        var isCandleThree_Bullish = candleThree_Close > candleThree_Open;

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open;

        var isCandleOne_Bullish = candleOne_Close > candleOne_Open;

        var candleOneBody = Math.abs(candleOne_Open - candleOne_Close),
           candleThreeBody = Math.abs(candleThree_Open - candleThree_Close),
           candleTwoBody = Math.abs(candleTwo_Open - candleTwo_Close),
           candleThreeUpperShadow = Math.abs(candleThree_High - candleThree_Close),
           candleTwoUpperShadow = Math.abs(candleTwo_High - candleTwo_Close),
           candleOneUpperShadow = Math.abs(candleOne_High - candleOne_Close);

        var isBullishContinuation = false;

        //Advance Block is bearish only
        var isBearishContinuation = isCandleThree_Bullish && (candleThreeBody >= candleMediumHeight) //Three long white days occur, each with a higher close than the previous day
                                    && isCandleTwo_Bullish && (candleTwoBody >= candleMediumHeight) && (candleTwoBody <= candleThreeBody) && (candleTwo_Close > candleThree_Close) && (candleTwo_Open <= candleThree_Close) && (candleTwo_Open > candleThree_Open) //Each day opens within the body of the previous day 
                                    && isCandleOne_Bullish && (candleOneBody <= candleTwoBody) && (candleOne_Close > candleTwo_Close) && (candleOne_Open <= candleTwo_Close) && (candleOne_Open > candleTwo_Open) //Each day opens within the body of the previous day
                                    && (candleTwoUpperShadow > candleThreeUpperShadow) && (candleOneUpperShadow > candleThreeUpperShadow); //The second and third days should also show long upper wicks


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
                if (!H || H.Series.prototype.addCDLADVANCEBLOCK) return;

                H.Series.prototype.addCDLADVANCEBLOCK = function (cdladvanceblockOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdladvanceblockOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdladvanceblockOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLADVANCEBLOCK series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLADVANCEBLOCK data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdladvanceblockData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLADVANCEBLOCK - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            //Advance Block is bearish only
                            if (bull_bear.isBearishContinuation) {
                                cdladvanceblockData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">AB</span>',
                                    text: 'Advance Block : Bear'
                                });
                            }
                        };

                        var chart = this.chart;

                        cdladvanceblockOptionsMap[uniqueID] = cdladvanceblockOptions;

                        var series = this;
                        cdladvanceblockSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLADVANCEBLOCK',
                            data: cdladvanceblockData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdladvanceblockSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdladvanceblock',
                            parentSeriesID: cdladvanceblockOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLADVANCEBLOCK = function (uniqueID) {
                    var chart = this.chart;
                    cdladvanceblockOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdladvanceblockSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLADVANCEBLOCK = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdladvanceblockOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdladvanceblockeed, options, redraw, shift, animation) {

                    pcdladvanceblockeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdladvanceblockOptionsMap, this.options.id)) {
                        updateCDLADVANCEBLOCKSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdladvanceblockeed, options, redraw, animation) {

                    pcdladvanceblockeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdladvanceblockOptionsMap, this.series.options.id)) {
                        updateCDLADVANCEBLOCKSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLADVANCEBLOCKSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLADVANCEBLOCK data point
                    for (var key in cdladvanceblockSeriesMap) {
                        if (cdladvanceblockSeriesMap[key] && cdladvanceblockSeriesMap[key].options && cdladvanceblockSeriesMap[key].options.data && cdladvanceblockSeriesMap[key].options.data.length > 0
                            && cdladvanceblockOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLADVANCEBLOCK series. Add one more CDLADVANCEBLOCK point
                            //Calculate CDLADVANCEBLOCK data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLADVANCEBLOCK - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLADVANCEBLOCK - end
                                var bullBearData = null;
                                //Advance Block is bearish only
                                if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">AB</span>',
                                        text: 'Advance Block : Bear'
                                    }
                                };

                                var whereToUpdate = -1;
                                for (var sIndx = cdladvanceblockSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdladvanceblockSeriesMap[key].data[sIndx].x || cdladvanceblockSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdladvanceblockSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdladvanceblockSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdladvanceblockSeriesMap[key].data[whereToUpdate].remove();
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
