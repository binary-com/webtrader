/**
 * Created by Mahboob.M on 12/28/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlpiercingOptionsMap = {}, cdlpiercingSeriesMap = {};
    
    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var isBullishContinuation = isCandleTwo_Bearish
                                    && isCandleOne_Bullish && candleOne_Open < candleTwo_Close //white candlestick must open below the previous close.
                                    && candleOne_Close > (Math.abs(candleTwo_Open - candleTwo_Close) / 2);//close above the midpoint of the black candlestick's body.

        var isBearishContinuation = isCandleTwo_Bullish 
                                    && isCandleOne_Bearish && candleOne_Open > candleTwo_Close //white candlestick must open above the previous close.
                                    && candleOne_Close < (Math.abs(candleTwo_Open - candleTwo_Close) / 2);//close bellow the midpoint of the black candlestick's body. 

        return {
            isBullishContinuation: index == isBullishContinuation,
            isBearishContinuation: isBearishContinuation
        };
    } 

    return {
        init: function () {

            (function (H, $, indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addCDLPIERCING) return;

                H.Series.prototype.addCDLPIERCING = function (cdlpiercingOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlpiercingOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlpiercingOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLPIERCING series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLPIERCING data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlpiercingData = [];
                        for (var index = 1 ; index < data.length; index++) {

                            //Calculate CDLPIERCING - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlpiercingData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">PP</span>',
                                    text: 'Upside Gap Two Crows : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlpiercingData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">PP</span>',
                                    text: 'Upside Gap Two Crows : Bear'
                                });
                            }
                            //Calculate CDLPIERCING - end
                        };

                        var chart = this.chart;

                        cdlpiercingOptionsMap[uniqueID] = cdlpiercingOptions;

                        var series = this;
                        cdlpiercingSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLPIERCING',
                            data: cdlpiercingData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlpiercingSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlpiercing',
                            parentSeriesID: cdlpiercingOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLPIERCING = function (uniqueID) {
                    var chart = this.chart;
                    cdlpiercingOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlpiercingSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLPIERCING = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlpiercingOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlpiercingeed, options, redraw, shift, animation) {

                    pcdlpiercingeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlpiercingOptionsMap, this.options.id)) {
                        updateCDLPIERCINGSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlpiercingeed, options, redraw, animation) {

                    pcdlpiercingeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlpiercingOptionsMap, this.series.options.id)) {
                        updateCDLPIERCINGSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLPIERCINGSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLPIERCING data point
                    for (var key in cdlpiercingSeriesMap) {
                        if (cdlpiercingSeriesMap[key] && cdlpiercingSeriesMap[key].options && cdlpiercingSeriesMap[key].options.data && cdlpiercingSeriesMap[key].options.data.length > 0
                            && cdlpiercingOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLPIERCING series. Add one more CDLPIERCING point
                            //Calculate CDLPIERCING data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLPIERCING - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLPIERCING - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">PP</span>',
                                        text: 'Upside Gap Two Crows : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">PP</span>',
                                        text: 'Upside Gap Two Crows : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlpiercingSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlpiercingSeriesMap[key].data[sIndx].x || cdlpiercingSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlpiercingSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlpiercingSeriesMap[key].addPoint(bullBearData);
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
