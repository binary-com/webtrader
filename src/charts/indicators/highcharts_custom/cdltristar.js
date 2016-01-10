/**
 * Created by Mahboob.M on 12/31/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdltristarOptionsMap = {}, cdltristarSeriesMap = {};

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index),
            candleThree_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleThree_Index),
            candleThree_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleThree_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
            candleTwo_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleTwo_Index),
            candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
            candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index);


        var candleThreeDoji = indicatorBase.isDoji({
            open: candleThree_Open,
            high: candleThree_High,
            low: candleThree_Low,
            close: candleThree_Close
        }) || {};


        var candleTwoDoji = indicatorBase.isDoji({
            open: candleTwo_Open,
            high: candleTwo_High,
            low: candleTwo_Low,
            close: candleTwo_Close
        }) || {};


        var candleOneDoji = indicatorBase.isDoji({
            open: candleOne_Open,
            high: candleOne_High,
            low: candleOne_Low,
            close: candleOne_Close
        }) || {};

        var isBullishContinuation = candleThreeDoji.isBull
                                    && candleTwoDoji.isBull && candleTwo_Low < candleOne_Low && candleTwo_Low < candleThree_Low //The Day 2 Doji has a gap bellow the first and third.
                                    && candleOneDoji.isBull;

        var isBearishContinuation = candleThreeDoji.isBear
                                    && candleTwoDoji.isBear && candleTwo_High > candleOne_High && candleTwo_High > candleThree_High //The Day 2 Doji has a gap above the first and third.
                                    && candleOneDoji.isBear;

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
                if (!H || H.Series.prototype.addCDLTRISTAR) return;

                H.Series.prototype.addCDLTRISTAR = function (cdltristarOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdltristarOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdltristarOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLTRISTAR series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLTRISTAR data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdltristarData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLTRISTAR - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdltristarData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">TSP</span>',
                                    text: 'Tristar Pattern : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdltristarData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">TSP</span>',
                                    text: 'Tristar Pattern : Bear'
                                });
                            }
                            //Calculate CDLTRISTAR - end
                        };

                        var chart = this.chart;

                        cdltristarOptionsMap[uniqueID] = cdltristarOptions;

                        var series = this;
                        cdltristarSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLTRISTAR',
                            data: cdltristarData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdltristarSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdltristar',
                            parentSeriesID: cdltristarOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLTRISTAR = function (uniqueID) {
                    var chart = this.chart;
                    cdltristarOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdltristarSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLTRISTAR = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdltristarOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdltristareed, options, redraw, shift, animation) {

                    pcdltristareed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdltristarOptionsMap, this.options.id)) {
                        updateCDLTRISTARSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdltristareed, options, redraw, animation) {

                    pcdltristareed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdltristarOptionsMap, this.series.options.id)) {
                        updateCDLTRISTARSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLTRISTARSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLTRISTAR data point
                    for (var key in cdltristarSeriesMap) {
                        if (cdltristarSeriesMap[key] && cdltristarSeriesMap[key].options && cdltristarSeriesMap[key].options.data && cdltristarSeriesMap[key].options.data.length > 0
                            && cdltristarOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLTRISTAR series. Add one more CDLTRISTAR point
                            //Calculate CDLTRISTAR data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLTRISTAR - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLTRISTAR - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">TSP</span>',
                                        text: 'Tristar Pattern : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">TSP</span>',
                                        text: 'Tristar Pattern : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdltristarSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdltristarSeriesMap[key].data[sIndx].x || cdltristarSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdltristarSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdltristarSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdltristarSeriesMap[key].data[whereToUpdate].remove();
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
