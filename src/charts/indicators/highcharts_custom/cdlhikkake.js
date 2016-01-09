/**
 * Created by Mahboob.M on 12/31/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlhikkakeOptionsMap = {}, cdlhikkakeSeriesMap = {};

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;
        var candleFor_Index = index - 3;
        var candleFive_Index = index - 4;

        var candleFive_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFive_Index),
            candleFive_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFive_Index);

        var candleFor_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFor_Index),
            candleFor_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFor_Index);

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
            candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
            candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;


        var isBullishContinuation = Math.max(candleFive_Close, candleFive_Open) > Math.max(candleFor_Close, candleFor_Open)
                                  && Math.min(candleFive_Close, candleFive_Open) < Math.min(candleFor_Close, candleFor_Open)
                                  && Math.max(candleFive_Close, candleFive_Open) > Math.max(candleThree_Close, candleThree_Open)
                                  && Math.max(candleFive_Close, candleFive_Open) > Math.max(candleTwo_Close, candleTwo_Open)
                                  && isCandleOne_Bullish
                                  && (candleOne_Close > Math.max(candleFive_Close, candleFive_Open));// reaches above the range of the three preceding ,

        var isBearishContinuation = Math.max(candleFive_Close, candleFive_Open) > Math.max(candleFor_Close, candleFor_Open)
                                  && Math.min(candleFive_Close, candleFive_Open) < Math.min(candleFor_Close, candleFor_Open)
                                  && Math.min(candleFive_Close, candleFive_Open) < Math.min(candleThree_Close, candleThree_Open)
                                  && Math.min(candleFive_Close, candleFive_Open) < Math.min(candleTwo_Close, candleTwo_Open)
                                  && isCandleOne_Bearish
                                  && (candleOne_Close < Math.min(candleFive_Close, candleFive_Open));

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
                if (!H || H.Series.prototype.addCDLHIKKAKE) return;

                H.Series.prototype.addCDLHIKKAKE = function (cdlhikkakeOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlhikkakeOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlhikkakeOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLHIKKAKE series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLHIKKAKE data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlhikkakeData = [];
                        for (var index = 4 ; index < data.length; index++) {

                            //Calculate CDLHIKKAKE - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlhikkakeData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">HKP</span>',
                                    text: 'Hikkake Pattern : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlhikkakeData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">HKP</span>',
                                    text: 'Hikkake Pattern : Bear'
                                });
                            }
                            //Calculate CDLHIKKAKE - end
                        };

                        var chart = this.chart;

                        cdlhikkakeOptionsMap[uniqueID] = cdlhikkakeOptions;

                        var series = this;
                        cdlhikkakeSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLHIKKAKE',
                            data: cdlhikkakeData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlhikkakeSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlhikkake',
                            parentSeriesID: cdlhikkakeOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLHIKKAKE = function (uniqueID) {
                    var chart = this.chart;
                    cdlhikkakeOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlhikkakeSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLHIKKAKE = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlhikkakeOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlhikkakeeed, options, redraw, shift, animation) {

                    pcdlhikkakeeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlhikkakeOptionsMap, this.options.id)) {
                        updateCDLHIKKAKESeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlhikkakeeed, options, redraw, animation) {

                    pcdlhikkakeeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlhikkakeOptionsMap, this.series.options.id)) {
                        updateCDLHIKKAKESeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLHIKKAKESeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart; 

                    //Add a new CDLHIKKAKE data point
                    for (var key in cdlhikkakeSeriesMap) {
                        if (cdlhikkakeSeriesMap[key] && cdlhikkakeSeriesMap[key].options && cdlhikkakeSeriesMap[key].options.data && cdlhikkakeSeriesMap[key].options.data.length > 0
                            && cdlhikkakeOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLHIKKAKE series. Add one more CDLHIKKAKE point
                            //Calculate CDLHIKKAKE data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLHIKKAKE - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLHIKKAKE - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">HKP</span>',
                                        text: 'Hikkake Pattern : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">HKP</span>',
                                        text: 'Hikkake Pattern : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlhikkakeSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlhikkakeSeriesMap[key].data[sIndx].x || cdlhikkakeSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlhikkakeSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlhikkakeSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlhikkakeSeriesMap[key].data[whereToUpdate].remove();
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
