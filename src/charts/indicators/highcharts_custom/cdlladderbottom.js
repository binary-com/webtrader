/**
 * Created by Mahboob.M on 1/2/16
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlladderbottomOptionsMap = {}, cdlladderbottomSeriesMap = {};

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index -2;
        var candleFor_Index = index - 3;
        var candleFive_Index = index - 4;


        var candleFive_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFive_Index),
			candleFive_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFive_Index);

        var candleFor_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleFor_Index),
			candleFor_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleFor_Index);

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
            candleTwo_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleTwo_Index),
            candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);
            

        var isCandleFive_Bullish = candleFive_Close > candleFive_Open,
			isCandleFive_Bearish = candleFive_Close < candleFive_Open;
        var isCandleFor_Bullish = candleFor_Close > candleFor_Open,
			isCandleFor_Bearish = candleFor_Close < candleFor_Open;
        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
           isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;


        var isBullishContinuation = isCandleFive_Bearish
                                    && isCandleFor_Bearish && candleFor_Open > candleFive_Close && candleFor_Close < candleFive_Close && candleFor_Open < candleFive_Open// 1st three days are red days with lower opens and closes each day.
                                    && isCandleThree_Bearish && candleThree_Open > candleFor_Close && candleThree_Close < candleFor_Close && candleThree_Open < candleFor_Open// 1st three days are red days with lower opens and closes each day.
                                    && isCandleTwo_Bearish && candleTwo_High > candleThree_Close  && candleTwo_High > candleTwo_Open && candleTwo_Close < candleThree_Close && candleTwo_Open < candleThree_Open // 4th day is a red day with an upper shadow.
                                    && isCandleOne_Bullish && candleOne_Open > candleTwo_Open; //The last day is white that opens above the body of the 4th day.
        
        //Is bullish only
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
                if (!H || H.Series.prototype.addCDLLADDERBOTTOM) return;

                H.Series.prototype.addCDLLADDERBOTTOM = function (cdlladderbottomOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlladderbottomOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlladderbottomOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLLADDERBOTTOM series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLLADDERBOTTOM data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlladderbottomData = [];
                        for (var index = 4 ; index < data.length; index++) {

                            //Calculate CDLLADDERBOTTOM - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlladderbottomData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">LB</span>',
                                    text: 'Ladder Bottom : Bull'
                                });
                            };
                            //if (bull_bear.isBearishContinuation) {
                            //    cdlladderbottomData.push({
                            //        x: data[index].x || data[index][0],
                            //        title: '<span style="color : red">HK</span>',
                            //        text: 'Hikkake Pattern : Bear'
                            //    });
                            //}
                            //Calculate CDLLADDERBOTTOM - end
                        };

                        var chart = this.chart;

                        cdlladderbottomOptionsMap[uniqueID] = cdlladderbottomOptions;

                        var series = this;
                        cdlladderbottomSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLLADDERBOTTOM',
                            data: cdlladderbottomData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlladderbottomSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlladderbottom',
                            parentSeriesID: cdlladderbottomOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLLADDERBOTTOM = function (uniqueID) {
                    var chart = this.chart;
                    cdlladderbottomOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlladderbottomSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLLADDERBOTTOM = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlladderbottomOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlladderbottomeed, options, redraw, shift, animation) {

                    pcdlladderbottomeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlladderbottomOptionsMap, this.options.id)) {
                        updateCDLLADDERBOTTOMSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlladderbottomeed, options, redraw, animation) {

                    pcdlladderbottomeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlladderbottomOptionsMap, this.series.options.id)) {
                        updateCDLLADDERBOTTOMSeries.call(this.series, this.x, true);
                    }

                });


                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLLADDERBOTTOMSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLLADDERBOTTOM data point
                    for (var key in cdlladderbottomSeriesMap) {
                        if (cdlladderbottomSeriesMap[key] && cdlladderbottomSeriesMap[key].options && cdlladderbottomSeriesMap[key].options.data && cdlladderbottomSeriesMap[key].options.data.length > 0
                            && cdlladderbottomOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLLADDERBOTTOM series. Add one more CDLLADDERBOTTOM point
                            //Calculate CDLLADDERBOTTOM data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                //Calculate CDLLADDERBOTTOM - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLLADDERBOTTOM - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">LB</span>',
                                        text: 'Ladder Bottom : Bull'
                                    }
                                };
                                //else if (bull_bear.isBearishContinuation) {
                                //    bullBearData = {
                                //        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                //        title: '<span style="color : red">HK</span>',
                                //        text: 'Ladder Bottom : Bear'
                                //    }
                                //};


                                var whereToUpdate = -1;
                                for (var sIndx = cdlladderbottomSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlladderbottomSeriesMap[key].data[sIndx].x || cdlladderbottomSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlladderbottomSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlladderbottomSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlladderbottomSeriesMap[key].data[whereToUpdate].remove();
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
