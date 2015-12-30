/**
 * Created by Mahboob.M on 12/30/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlharamicrossOptionsMap = {}, cdlharamicrossSeriesMap = {};

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
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var response = indicatorBase.isDoji({
            open: candleOne_Open,
            high: candleOne_High,
            low: candleOne_Low,
            close: candleOne_Close
        }) || {};

        var isBullishContinuation = isCandleTwo_Bearish //the first candlestick is upward
                                    && response.isBull && candleOne_Low > candleTwo_Close && candleOne_High < candleTwo_Open; //followed by a doji that is located within the top and bottom of the candlestick's body. 

        var isBearishContinuation = isCandleTwo_Bullish // a large bullish green candle on Day 1
                                    && response.isBear && candleOne_Low > candleTwo_Open && candleOne_High < candleTwo_Close; //followed by a doji that is located within the top and bottom of the candlestick's body. 
                                
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
                if (!H || H.Series.prototype.addCDLHARAMICROSS) return;

                H.Series.prototype.addCDLHARAMICROSS = function (cdlharamicrossOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlharamicrossOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlharamicrossOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLHARAMICROSS series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLHARAMICROSS data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlharamicrossData = [];
                        for (var index = 1 ; index < data.length; index++) {

                            //Calculate CDLHARAMICROSS - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlharamicrossData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">HCP</span>',
                                    text: 'Harami Cross Pattern : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlharamicrossData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">HCP</span>',
                                    text: 'Harami Cross Pattern : Bear'
                                });
                            }
                            //Calculate CDLHARAMICROSS - end
                        };

                        var chart = this.chart;

                        cdlharamicrossOptionsMap[uniqueID] = cdlharamicrossOptions;

                        var series = this;
                        cdlharamicrossSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLHARAMICROSS',
                            data: cdlharamicrossData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlharamicrossSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlharamicross',
                            parentSeriesID: cdlharamicrossOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLHARAMICROSS = function (uniqueID) {
                    var chart = this.chart;
                    cdlharamicrossOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlharamicrossSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLHARAMICROSS = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlharamicrossOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlharamicrosseed, options, redraw, shift, animation) {

                    pcdlharamicrosseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlharamicrossOptionsMap, this.options.id)) {
                        updateCDLHARAMICROSSSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlharamicrosseed, options, redraw, animation) {

                    pcdlharamicrosseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlharamicrossOptionsMap, this.series.options.id)) {
                        updateCDLHARAMICROSSSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLHARAMICROSSSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLHARAMICROSS data point
                    for (var key in cdlharamicrossSeriesMap) {
                        if (cdlharamicrossSeriesMap[key] && cdlharamicrossSeriesMap[key].options && cdlharamicrossSeriesMap[key].options.data && cdlharamicrossSeriesMap[key].options.data.length > 0
                            && cdlharamicrossOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLHARAMICROSS series. Add one more CDLHARAMICROSS point
                            //Calculate CDLHARAMICROSS data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLHARAMICROSS - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLHARAMICROSS - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">HCP</span>',
                                        text: 'Harami Cross Pattern : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">HCP</span>',
                                        text: 'Harami Cross Pattern : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlharamicrossSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlharamicrossSeriesMap[key].data[sIndx].x || cdlharamicrossSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlharamicrossSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlharamicrossSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlharamicrossSeriesMap[key].data[whereToUpdate].remove();
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
