/**
 * Created by Mahboob.M on 12/28/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlxsidegap3methodsOptionsMap = {}, cdlxsidegap3methodsSeriesMap = {};

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
            candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index);

        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
			isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;


        var isBullishContinuation = isCandleThree_Bullish
                                    && isCandleTwo_Bullish && candleTwo_Open > candleThree_Close //gaps above 1st day
                                    && isCandleOne_Bearish && candleOne_Open > candleTwo_Open && candleOne_Open < candleTwo_Close //The third day opens lower, into the body of the top white (or green) candle 
                                    && candleOne_Close < candleThree_Close && candleOne_Close > candleThree_Open;//and closes into the body of the first white (or green) candle.

        var isBearishContinuation = isCandleThree_Bearish
                                    && isCandleTwo_Bearish && candleTwo_Open < candleThree_Close //gaps below 1st day
                                    && isCandleOne_Bullish && candleOne_Open < candleTwo_Open && candleOne_Open > candleTwo_Close
                                    && candleOne_Close > candleThree_Close && candleOne_Close < candleThree_Open;

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
                if (!H || H.Series.prototype.addCDLXSIDEGAP3METHODS) return;

                H.Series.prototype.addCDLXSIDEGAP3METHODS = function (cdlxsidegap3methodsOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlxsidegap3methodsOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlxsidegap3methodsOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLXSIDEGAP3METHODS series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLXSIDEGAP3METHODS data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        var cdlxsidegap3methodsData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLXSIDEGAP3METHODS - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlxsidegap3methodsData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">GTM</span>',
                                    text: 'Upside/Downside Gap Three Methods : Bull'
                                });
                            }
                            if (bull_bear.isBearishContinuation) {
                                cdlxsidegap3methodsData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : red">GTM</span>',
                                    text: 'Upside/Downside Gap Three Methods : Bear'
                                });
                            }
                            //Calculate CDLXSIDEGAP3METHODS - end
                        };

                        var chart = this.chart;

                        cdlxsidegap3methodsOptionsMap[uniqueID] = cdlxsidegap3methodsOptions;

                        var series = this;
                        cdlxsidegap3methodsSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLXSIDEGAP3METHODS',
                            data: cdlxsidegap3methodsData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlxsidegap3methodsSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlxsidegap3methods',
                            parentSeriesID: cdlxsidegap3methodsOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLXSIDEGAP3METHODS = function (uniqueID) {
                    var chart = this.chart;
                    cdlxsidegap3methodsOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlxsidegap3methodsSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLXSIDEGAP3METHODS = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlxsidegap3methodsOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlxsidegap3methodseed, options, redraw, shift, animation) {

                    pcdlxsidegap3methodseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlxsidegap3methodsOptionsMap, this.options.id)) {
                        updateCDLXSIDEGAP3METHODSSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlxsidegap3methodseed, options, redraw, animation) {

                    pcdlxsidegap3methodseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlxsidegap3methodsOptionsMap, this.series.options.id)) {
                        updateCDLXSIDEGAP3METHODSSeries.call(this.series, this.x, true);
                    }

                });
                

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLXSIDEGAP3METHODSSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLUPSIDEGAP2CROWS data point
                    for (var key in cdlxsidegap3methodsSeriesMap) {
                        if (cdlxsidegap3methodsSeriesMap[key] && cdlxsidegap3methodsSeriesMap[key].options && cdlxsidegap3methodsSeriesMap[key].options.data && cdlxsidegap3methodsSeriesMap[key].options.data.length > 0
                            && cdlxsidegap3methodsOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLUPSIDEGAP2CROWS series. Add one more CDLUPSIDEGAP2CROWS point
                            //Calculate CDLUPSIDEGAP2CROWS data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                               
                                //Calculate CDLUPSIDEGAP2CROWS - start
                                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDLUPSIDEGAP2CROWS - end
                                var bullBearData = null;
                                if (bull_bear.isBullishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : blue">GTM</span>',
                                        text: 'Upside Gap Two Crows : Bull'
                                    }
                                }
                                else if (bull_bear.isBearishContinuation) {
                                    bullBearData = {
                                        x: data[dataPointIndex].x || data[dataPointIndex][0],
                                        title: '<span style="color : red">GTM</span>',
                                        text: 'Upside Gap Two Crows : Bear'
                                    }
                                };


                                var whereToUpdate = -1;
                                for (var sIndx = cdlxsidegap3methodsSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlxsidegap3methodsSeriesMap[key].data[sIndx].x || cdlxsidegap3methodsSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlxsidegap3methodsSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlxsidegap3methodsSeriesMap[key].addPoint(bullBearData);
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
