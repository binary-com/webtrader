/**
 * Created by Mahboob.M on 1/2/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlidentical3crowsOptionsMap = {}, cdlidentical3crowsSeriesMap = {};
    var candleMediumHeight = 0.0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index,
			candleTwo_Index = index - 1,
			candleThree_Index = index - 2,
            candleFour_Index = index - 3;

        var candleFour_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFour_Index),
			candleFour_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFour_Index),
            candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index),
			candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
			candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var isCandleFour_Bullish = candleFour_Close > candleFour_Open,
			isCandleThree_Bearish = candleThree_Close < candleThree_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var candleThreeBodySize = Math.abs(candleThree_Close - candleThree_Open),
            candleTwoBodySize = Math.abs(candleTwo_Close - candleTwo_Open),
            candleOneBodySize = Math.abs(candleOne_Close - candleOne_Open);

        var isBullishContinuation = false;
        //Is bearish only
        var isBearishContinuation = isCandleFour_Bullish
                                 && isCandleThree_Bearish && (candleThreeBodySize > candleMediumHeight)
				                 && isCandleTwo_Bearish && (candleTwoBodySize > candleMediumHeight) && (candleTwo_Open === candleThree_Close || (Math.abs(candleThree_Close - candleTwo_Open) < (candleThreeBodySize * .1))) && candleTwo_Close < candleThree_Close //Three consecutive long red days with lower closes each day
					             && isCandleOne_Bearish && (candleOneBodySize > candleMediumHeight) && (candleOne_Open === candleTwo_Close || (Math.abs(candleTwo_Close - candleOne_Open) < (candleTwoBodySize * .1))) && candleOne_Close < candleTwo_Close;  //and Each day opens at or near the previous day's close.


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
                if (!H || H.Series.prototype.addCDLIDENTICAL3CROWS) return;

                H.Series.prototype.addCDLIDENTICAL3CROWS = function (cdlidentical3crowsOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlidentical3crowsOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlidentical3crowsOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLIDENTICAL3CROWS series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLIDENTICAL3CROWS data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlidentical3crowsData = [];
                        for (var index = 3; index < data.length; index++) {

                            //Calculate CDLIDENTICAL3CROWS - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            var isBullishContinuation = bull_bear.isBullishContinuation,
								isBearishContinuation = bull_bear.isBearishContinuation;

                            //Its a bearish only
                            if (isBearishContinuation) {
                                cdlidentical3crowsData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">ITC</span>',
                                    text: 'Identical Three Crows : Bear'
                                });
                            }
                            //Calculate CDLIDENTICAL3CROWS - end

                        }

                        var chart = this.chart;

                        cdlidentical3crowsOptionsMap[uniqueID] = cdlidentical3crowsOptions;


                        var series = this;
                        cdlidentical3crowsSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLIDENTICAL3CROWS',
                            data: cdlidentical3crowsData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlidentical3crowsSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlidentical3crows',
                            parentSeriesID: cdlidentical3crowsOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLIDENTICAL3CROWS = function (uniqueID) {
                    var chart = this.chart;
                    cdlidentical3crowsOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlidentical3crowsSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLIDENTICAL3CROWS = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlidentical3crowsOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlidentical3crowseed, options, redraw, shift, animation) {

                    pcdlidentical3crowseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlidentical3crowsOptionsMap, this.options.id)) {
                        updateCDLIDENTICAL3CROWSSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlidentical3crowseed, options, redraw, animation) {

                    pcdlidentical3crowseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlidentical3crowsOptionsMap, this.series.options.id)) {
                        updateCDLIDENTICAL3CROWSSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLIDENTICAL3CROWSSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLIDENTICAL3CROWS data point
                    for (var key in cdlidentical3crowsSeriesMap) {
                        if (cdlidentical3crowsSeriesMap[key] && cdlidentical3crowsSeriesMap[key].options && cdlidentical3crowsSeriesMap[key].options.data && cdlidentical3crowsSeriesMap[key].options.data.length > 0
                            && cdlidentical3crowsOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLIDENTICAL3CROWS series. Add one more CDLIDENTICAL3CROWS point
                            //Calculate CDLIDENTICAL3CROWS data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdlidentical3crowsOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLIDENTICAL3CROWS - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //console.log('Roc : ' + cdlidentical3crowsValue);
                                //Calculate CDLIDENTICAL3CROWS - end
                                var bullBearData = null;
                                //its a bearish only
                                if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">ITC</span>',
                                        text: 'Identical Three Crows : Bear'
                                    }
                                }

                                var whereToUpdate = -1;
                                for (var sIndx = cdlidentical3crowsSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlidentical3crowsSeriesMap[key].data[sIndx].x || cdlidentical3crowsSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlidentical3crowsSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlidentical3crowsSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlidentical3crowsSeriesMap[key].data[whereToUpdate].remove();
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
