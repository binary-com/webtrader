/**
 * Created by Mahboob.M on 12/30/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlinvertedhammerOptionsMap = {}, cdlinvertedhammerSeriesMap = {};
    var candleMediumHeight = 0.0;

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

        var candleOneUpperShadow = Math.abs(Math.max(candleOne_Open, candleOne_Close) - candleOne_High);
        var candleOneBody = Math.abs(candleOne_Open - candleOne_Close);
        var candleOneLowerShadow = Math.abs(candleOne_Low - Math.min(candleOne_Close, candleOne_Open));

        var isBullishContinuation = (Math.min(candleTwo_Close, candleTwo_Open) < (Math.min(candleThree_Open, candleThree_Close)))
                                    && (Math.min(candleOne_Close, candleOne_Open) < Math.min(candleTwo_Close, candleTwo_Open))  //a downward trend indicating a bullish reversal, it is a inverted hammer
                                    && (candleOneLowerShadow <= (candleOneBody * 0.10)) && (candleOneBody < candleMediumHeight) //the open, low, and close are roughly the same price. means it has a small body.
                                    && (candleOneUpperShadow >= (2.0 * candleOneBody)); //there is a long upper shadow, which should be at least twice the length of the real body.

        //Inverted Hammer is bullish only
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
                if (!H || H.Series.prototype.addCDLINVERTEDHAMMER) return;

                H.Series.prototype.addCDLINVERTEDHAMMER = function (cdlinvertedhammerOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlinvertedhammerOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlinvertedhammerOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLINVERTEDHAMMER series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLINVERTEDHAMMER data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlinvertedhammerData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLINVERTEDHAMMER - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            //upperShadow is bullish only
                            if (bull_bear.isBullishContinuation) {
                                cdlinvertedhammerData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">IH</span>',
                                    text: 'Inverted Hammer : Bull'
                                });
                            };
                        };

                        var chart = this.chart;

                        cdlinvertedhammerOptionsMap[uniqueID] = cdlinvertedhammerOptions;

                        var series = this;
                        cdlinvertedhammerSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLINVERTEDHAMMER',
                            data: cdlinvertedhammerData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlinvertedhammerSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlinvertedhammer',
                            parentSeriesID: cdlinvertedhammerOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLINVERTEDHAMMER = function (uniqueID) {
                    var chart = this.chart;
                    cdlinvertedhammerOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlinvertedhammerSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLINVERTEDHAMMER = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlinvertedhammerOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlinvertedhammereed, options, redraw, shift, animation) {

                    pcdlinvertedhammereed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlinvertedhammerOptionsMap, this.options.id)) {
                        updateCDLINVERTEDHAMMERSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlinvertedhammereed, options, redraw, animation) {

                    pcdlinvertedhammereed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlinvertedhammerOptionsMap, this.series.options.id)) {
                        updateCDLINVERTEDHAMMERSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLINVERTEDHAMMERSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLINVERTEDHAMMER data point
                    for (var key in cdlinvertedhammerSeriesMap) {
                        if (cdlinvertedhammerSeriesMap[key] && cdlinvertedhammerSeriesMap[key].options && cdlinvertedhammerSeriesMap[key].options.data && cdlinvertedhammerSeriesMap[key].options.data.length > 0
                            && cdlinvertedhammerOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLINVERTEDHAMMER series. Add one more CDLINVERTEDHAMMER point
                            //Calculate CDLINVERTEDHAMMER data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLINVERTEDHAMMER - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLINVERTEDHAMMER - end
                                var bullBearData = null;
                                //upperShadow is bullish only
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">IH</span>',
                                        text: 'Inverted Hammer : Bull'
                                    }
                                };

                                var whereToUpdate = -1;
                                for (var sIndx = cdlinvertedhammerSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlinvertedhammerSeriesMap[key].data[sIndx].x || cdlinvertedhammerSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlinvertedhammerSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlinvertedhammerSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlinvertedhammerSeriesMap[key].data[whereToUpdate].remove();
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
