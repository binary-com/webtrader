/**
 * Created by arnab on 3/22/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlengulfingOptionsMap = {}, cdlengulfingSeriesMap = {};

	function calculateIndicatorValue(data, index) {
		var candleOne_Index = index;
		var candleTwo_Index = index - 1;

		var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
            candleTwo_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleTwo_Index),
            candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index),

            candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
            candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
            candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index)
          ;

		var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
		var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

		var isBearishContinuation = isCandleOne_Bearish && isCandleTwo_Bullish && candleTwo_Close < candleOne_Open && candleTwo_Open > candleOne_Close;

		var isBullishContinuation = isCandleOne_Bullish && isCandleTwo_Bearish && candleTwo_Close > candleOne_Open && candleTwo_Open < candleOne_Close;

		return {
			isBullishContinuation : isBullishContinuation,
			isBearishContinuation : isBearishContinuation
		};
	}

    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addCDLENGULFING) return;

                H.Series.prototype.addCDLENGULFING = function ( cdlengulfingOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlengulfingOptions = $.extend({
                        //stroke : 'red',
                        //strokeWidth : 2,
                        //dashStyle : 'line',
                        //levels : [],
                        parentSeriesID : seriesID
                    }, cdlengulfingOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLENGULFING series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDLENGULFING data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdlengulfingData = [];
                        for (var index = 2; index < data.length; index++)
                        {

                            //Calculate CDLENGULFING - start
                            var bull_bear = calculateIndicatorValue(data, index);
                            var isBullishContinuation = bull_bear.isBullishContinuation,
                                isBearishContinuation = bull_bear.isBearishContinuation;

                            if (isBullishContinuation) {
                                cdlengulfingData.push({
                                    x : data[index].x || data[index][0],
                                    title : '<span style="color : blue">EP</span>',
                                    text : 'Engulfing Pattern : Bull'
                                });
                            }
                            if (isBearishContinuation) {
                                cdlengulfingData.push({
                                    x : data[index].x || data[index][0],
                                    title : '<span style="color : red">EP</span>',
                                    text : 'Engulfing Pattern : Bear'
                                });
                            }
                            //Calculate CDLENGULFING - end

                        }

                        var chart = this.chart;

                        cdlengulfingOptionsMap[uniqueID] = cdlengulfingOptions;


                        var series = this;
                        cdlengulfingSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLENGULFING',
                            data: cdlengulfingData,
                            type: 'flags',
                            //dataGrouping: series.options.dataGrouping,
                            //yAxis: 'cdlengulfing'+ uniqueID,
                            //opposite: series.options.opposite,
                            //color: cdlengulfingOptions.stroke,
                            //lineWidth: cdlengulfingOptions.strokeWidth,
                            //dashStyle: cdlengulfingOptions.dashStyle,
                            onSeries: seriesID,
                            shape: 'flag',
                            turboThreshold: 0
                        }, false, false);

                        $(cdlengulfingSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlengulfing',
                            parentSeriesID: cdlengulfingOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLENGULFING = function (uniqueID) {
                    var chart = this.chart;
                    cdlengulfingOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlengulfingSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdlengulfingeed, options, redraw, shift, animation) {

                    pcdlengulfingeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlengulfingOptionsMap, this.options.id)) {
                        updateCDLENGULFINGSeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdlengulfingeed, options, redraw, animation) {

                    pcdlengulfingeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlengulfingOptionsMap, this.series.options.id)) {
                        updateCDLENGULFINGSeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLENGULFINGSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLENGULFING data point
                    for (var key in cdlengulfingSeriesMap) {
                        if (cdlengulfingSeriesMap[key] && cdlengulfingSeriesMap[key].options && cdlengulfingSeriesMap[key].options.data && cdlengulfingSeriesMap[key].options.data.length > 0
                            && cdlengulfingOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLENGULFING series. Add one more CDLENGULFING point
                            //Calculate CDLENGULFING data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdlengulfingOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLENGULFING - start
								var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //console.log('Roc : ' + cdlengulfingValue);
                                //Calculate CDLENGULFING - end
								var bullBearData = null;
								if (bull_bear.isBullishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : blue">DS</span>',
											text : 'Doji Star : Bull'
									}
								} else if (bull_bear.isBearishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : red">DS</span>',
											text : 'Doji Star : Bear'
									}
								}

								var whereToUpdate = -1;
								for (var sIndx = cdlengulfingSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
									if ((cdlengulfingSeriesMap[key].data[sIndx].x || cdlengulfingSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
										whereToUpdate = sIndx;
										break;
									}
								}
								if (bullBearData) {
	                                if (isPointUpdate)
	                                {
										if (whereToUpdate >= 0)
	                                    {
											cdlengulfingSeriesMap[key].data[whereToUpdate].remove();
										}
	                                }
                                    cdlengulfingSeriesMap[key].addPoint(bullBearData);
								} else {
									if (whereToUpdate>=0)
									{
										cdlengulfingSeriesMap[key].data[whereToUpdate].remove();
									}
								}
                            }
                        }
                    }
                }

            })(Highcharts, jQuery,indicatorBase);

        }
    }

});
