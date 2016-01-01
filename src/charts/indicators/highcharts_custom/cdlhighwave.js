/**
 * Created by Mahboob.M on 12/31/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlhighwaveOptionsMap = {}, cdlhighwaveSeriesMap = {};

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
            candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index);

        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var bodySize = Math.abs(candleOne_Close - candleOne_Open);
        var candleSize = Math.abs(candleOne_High - candleOne_Low);
        var upperShadow  = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close));
        var lowerShadow = Math.abs(Math.min(candleOne_Open, candleOne_Close) - candleOne_Low);
        return (bodySize > (Math.max(upperShadow ,lowerShadow) * 0.10)) && (bodySize < (lowerShadow /3)) && (bodySize < (upperShadow / 3));//“High Wave” is a candlestick with a small body and long shadows.

    }

    return {
        init: function () {

            (function (H, $, indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addCDLHIGHWAVE) return;

                H.Series.prototype.addCDLHIGHWAVE = function (cdlhighwaveOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlhighwaveOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlhighwaveOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLHIGHWAVE series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLHIGHWAVE data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlhighwaveData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLHIGHWAVE - start
                            var isCandlePttern = calculateIndicatorValue(data, index);

                            if (isCandlePttern) {
                                cdlhighwaveData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">HW</span>',
                                    text: 'High Wave'
                                });
                            }
                            
                            //Calculate CDLHIGHWAVE - end
                        };

                        var chart = this.chart;

                        cdlhighwaveOptionsMap[uniqueID] = cdlhighwaveOptions;

                        var series = this;
                        cdlhighwaveSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLHIGHWAVE',
                            data: cdlhighwaveData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlhighwaveSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlhighwave',
                            parentSeriesID: cdlhighwaveOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLHIGHWAVE = function (uniqueID) {
                    var chart = this.chart;
                    cdlhighwaveOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlhighwaveSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLHIGHWAVE = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlhighwaveOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlhighwaveeed, options, redraw, shift, animation) {

                    pcdlhighwaveeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlhighwaveOptionsMap, this.options.id)) {
                        updateCDLHIGHWAVESeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlhighwaveeed, options, redraw, animation) {

                    pcdlhighwaveeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlhighwaveOptionsMap, this.series.options.id)) {
                        updateCDLHIGHWAVESeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLHIGHWAVESeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLHIGHWAVE data point
                    for (var key in cdlhighwaveSeriesMap) {
                        if (cdlhighwaveSeriesMap[key] && cdlhighwaveSeriesMap[key].options && cdlhighwaveSeriesMap[key].options.data && cdlhighwaveSeriesMap[key].options.data.length > 0
                            && cdlhighwaveOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLHIGHWAVE series. Add one more CDLHIGHWAVE point
                            //Calculate CDLHIGHWAVE data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLHIGHWAVE - start
                                var isCandlePattern= calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLHIGHWAVE - end
                                var bullBearData = null;
                                if (isCandlePattern) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">HW</span>',
                                        text: 'High Wave'
                                    }
                                };
                                

                                var whereToUpdate = -1;
                                for (var sIndx = cdlhighwaveSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlhighwaveSeriesMap[key].data[sIndx].x || cdlhighwaveSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlhighwaveSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlhighwaveSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlhighwaveSeriesMap[key].data[whereToUpdate].remove();
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
