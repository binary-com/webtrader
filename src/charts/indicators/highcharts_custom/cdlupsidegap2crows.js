/**
 * Created by Mahboob.M on 12/28/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlupsidegap2crowsOptionsMap = {}, cdlupsidegap2crowsSeriesMap = {};
    var candleMediumHeight = 0;

    function calculateIndicatorValue(data, index) {
        var candleOne_Index = index;
        var candleTwo_Index = index - 1;
        var candleThree_Index = index - 2;

        var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index);

        var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);

        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
			isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;



        var isBullishContinuation = isCandleThree_Bullish && (Math.abs(candleThree_Close - candleThree_Open) > candleMediumHeight) //by a long white candlestick
                                    && isCandleTwo_Bearish && (Math.abs(candleTwo_Close - candleTwo_Open) < (candleMediumHeight * 0.60)) //small black candle with a body
                                    && (candleTwo_Close > candleThree_Close)//  gapping above the prior candle's body.
                                    && isCandleOne_Bearish && (candleOne_Close < candleTwo_Close && candleOne_Open > candleTwo_Open) //opening higher than the Day 2 open, but closing below the Day 2 close
                                    && (candleOne_Close > candleThree_Close);// and above the Day 1 close


        return {
            isBullishContinuation: isBullishContinuation,
            isBearishContinuation: false
        };
    }

    return {
        init: function () {

            (function (H, $, indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addCDLUPSIDEGAP2CROWS) return;

                H.Series.prototype.addCDLUPSIDEGAP2CROWS = function (cdlupsidegap2crowsOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlupsidegap2crowsOptions = $.extend({
                        parentSeriesID: seriesID
                    }, cdlupsidegap2crowsOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLUPSIDEGAP2CROWS series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //Calculate CDLUPSIDEGAP2CROWS data
                        /*
                         * Formula(OHLC or Candlestick) -
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdlupsidegap2crowsData = [];
                        for (var index = 2 ; index < data.length; index++) {

                            //Calculate CDLUPSIDEGAP2CROWS - start
                            var bull_bear = calculateIndicatorValue(data, index);

                            if (bull_bear.isBullishContinuation) {
                                cdlupsidegap2crowsData.push({
                                    x: data[index].x || data[index][0],
                                    title: '<span style="color : blue">UGTC</span>',
                                    text: 'Upside Gap Two Crows : Bull'
                                });
                            };
                        }

                        var chart = this.chart;

                        cdlupsidegap2crowsOptionsMap[uniqueID] = cdlupsidegap2crowsOptions;

                        var series = this;
                        cdlupsidegap2crowsSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLUPSIDEGAP2CROWS',
                            data: cdlupsidegap2crowsData,
                            type: 'flags',
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlupsidegap2crowsSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlupsidegap2crows',
                            parentSeriesID: cdlupsidegap2crowsOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLUPSIDEGAP2CROWS = function (uniqueID) {
                    var chart = this.chart;
                    cdlupsidegap2crowsOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlupsidegap2crowsSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLUPSIDEGAP2CROWS = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cdlupsidegap2crowsOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (pcdlupsidegap2crowseed, options, redraw, shift, animation) {

                    pcdlupsidegap2crowseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlupsidegap2crowsOptionsMap, this.options.id)) {
                        updateCDLUPSIDEGAP2CROWSSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (pcdlupsidegap2crowseed, options, redraw, animation) {

                    pcdlupsidegap2crowseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlupsidegap2crowsOptionsMap, this.series.options.id)) {
                        updateCDLUPSIDEGAP2CROWSSeries.call(this.series, this.x, true);
                    }

                });
                

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLUPSIDEGAP2CROWSSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLUPSIDEGAP2CROWS data point
                    for (var key in cdlupsidegap2crowsSeriesMap) {
                        if (cdlupsidegap2crowsSeriesMap[key] && cdlupsidegap2crowsSeriesMap[key].options && cdlupsidegap2crowsSeriesMap[key].options.data && cdlupsidegap2crowsSeriesMap[key].options.data.length > 0
                            && cdlupsidegap2crowsOptionsMap[key].parentSeriesID == series.options.id) {
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
                                        title: '<span style="color : blue">UGTC</span>',
                                        text: 'Upside Gap Two Crows : Bull'
                                    }
                                };

                                var whereToUpdate = -1;
                                for (var sIndx = cdlupsidegap2crowsSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                                    if ((cdlupsidegap2crowsSeriesMap[key].data[sIndx].x || cdlupsidegap2crowsSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                                        whereToUpdate = sIndx;
                                        break;
                                    }
                                }
                                if (bullBearData) {
                                    if (isPointUpdate) {
                                        if (whereToUpdate >= 0) {
                                            cdlupsidegap2crowsSeriesMap[key].data[whereToUpdate].remove();
                                        }
                                    }
                                    cdlupsidegap2crowsSeriesMap[key].addPoint(bullBearData);
                                } else {
                                    if (whereToUpdate >= 0) {
                                        cdlupsidegap2crowsSeriesMap[key].data[whereToUpdate].remove();
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
