/**
 * Created by Mahboob.M on 1/1/16.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlfractalsOptionsMap = {}, cdlfractalsSeriesMap = {};

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index -1;
        var candleTwo_Index = index - 2;
        var candleThree_Index = index;
        var candleFor_Index = index + 1;
        var candleFive_Index = index + 2;

        var candleFive_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleFive_Index),
            candleFive_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleFive_Index);

        var candleFor_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleFor_Index),
			candleFor_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleFor_Index);

        var candleThree_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleThree_Index),
            candleThree_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleThree_Index);

        var candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index),
			candleTwo_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleTwo_Index);

        var candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index);


        var isBullishContinuation = candleThree_Low < candleFor_Low && candleThree_Low < candleFive_Low
                                  && candleThree_Low < candleTwo_Low && candleThree_Low < candleOne_Low;

        var isBearishContinuation = candleThree_High > candleFor_High && candleThree_High > candleFive_High
                                  && candleThree_High > candleTwo_High && candleThree_High > candleOne_High;


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
                if (!H || H.Series.prototype.addCDLFRACTALS) return;

                H.Series.prototype.addCDLFRACTALS = function (cdlfractalsOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlfractalsOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlfractalsOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLFRACTALS series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLFRACTALS data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlfractalsData = [];
                        for (var index = 2; index < data.length-2; index++) {

                            //Calculate CDLFRACTALS - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            var isBullishContinuation = bull_bear.isBullishContinuation,
                                isBearishContinuation = bull_bear.isBearishContinuation;

                            if (isBullishContinuation) {
                                cdlfractalsData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">F</span>',
                                    text: 'Fractal : Bull'
                                });
                            }
                            if (isBearishContinuation) {
                                cdlfractalsData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">F</span>',
                                    text: 'Fractal : Bear'
                                });
                            }
                            //Calculate CDLFRACTALS - end

                        }

                        var chart = this.chart;

                        cdlfractalsOptionsMap[uniqueID] = cdlfractalsOptions;


                        var series = this;
                        cdlfractalsSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLFRACTALS',
                            data: cdlfractalsData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlfractalsSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlfractals',
                            parentSeriesID: cdlfractalsOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLFRACTALS = function (uniqueID) {
                    var chart = this.chart;
                    cdlfractalsOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlfractalsSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLFRACTALS = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlfractalsOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlfractalseed, options, redraw, shift, animation) {

                    pcdlfractalseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlfractalsOptionsMap, this.options.id)) {
                        updateCDLFRACTALSSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlfractalseed, options, redraw, animation) {

                    pcdlfractalseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlfractalsOptionsMap, this.series.options.id)) {
                        updateCDLFRACTALSSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLFRACTALSSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLFRACTALS data point
                    for (var key in cdlfractalsSeriesMap) {
                        if (cdlfractalsSeriesMap[key] && cdlfractalsSeriesMap[key].options && cdlfractalsSeriesMap[key].options.data && cdlfractalsSeriesMap[key].options.data.length > 0
                            && cdlfractalsOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLFRACTALS series. Add one more CDLFRACTALS point
                            //Calculate CDLFRACTALS data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdlfractalsOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLFRACTALS - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLFRACTALS - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">F</span>',
                                        text: 'Fractal : Bull'
                                    }
                                } else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">F</span>',
                                        text: 'Fractal : Bear'
                                    }
                                }

                                var whereToUpdate = -1;
                                for (var sIndx = cdlfractalsSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlfractalsSeriesMap[key].data[sIndx].x || cdlfractalsSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlfractalsSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlfractalsSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlfractalsSeriesMap[key].data[whereToUpdate].remove();
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
