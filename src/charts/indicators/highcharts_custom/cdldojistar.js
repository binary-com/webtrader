/**
 * Created by arnab on 3/22/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdldojistarOptionsMap = {}, cdldojistarSeriesMap = {};

	function calculateIndicatorValue(data, index) {
		var candleOne_Index = index;
		var candleTwo_Index = index - 1;

		var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index);
    var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
        candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
        candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
        candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index)
      ;

    var response = indicatorBase.isDoji({
      open: candleOne_Open,
      high: candleOne_High,
      low: candleOne_Low,
      close: candleOne_Close
    }) || {};

		var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
		var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

		var isBearishContinuation = isCandleTwo_Bullish && response.isBear;

		var isBullishContinuation = isCandleTwo_Bearish && response.isBull;

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
                if (!H || H.Series.prototype.addCDLDOJISTAR) return;

                H.Series.prototype.addCDLDOJISTAR = function ( cdldojistarOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdldojistarOptions = $.extend({
                        //stroke : 'red',
                        //strokeWidth : 2,
                        //dashStyle : 'line',
                        //levels : [],
                        parentSeriesID : seriesID
                    }, cdldojistarOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLDOJISTAR series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDLDOJISTAR data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdldojistarData = [];
                        for (var index = 2; index < data.length; index++)
                        {

                            //Calculate CDLDOJISTAR - start
              							var bull_bear = calculateIndicatorValue(data, index);
              							var isBullishContinuation = bull_bear.isBullishContinuation,
              								isBearishContinuation = bull_bear.isBearishContinuation;

              							if (isBullishContinuation) {
              								cdldojistarData.push({
              									x : data[index].x || data[index][0],
              									title : '<span style="color : blue">DS</span>',
              									text : 'Doji Star : Bull'
              								});
              							}
              							if (isBearishContinuation) {
              								cdldojistarData.push({
              									x : data[index].x || data[index][0],
              									title : '<span style="color : red">DS</span>',
              									text : 'Doji Star : Bear'
              								});
              							}
                            //Calculate CDLDOJISTAR - end

                        }

                        var chart = this.chart;

                        cdldojistarOptionsMap[uniqueID] = cdldojistarOptions;


                        var series = this;
                        cdldojistarSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLDOJISTAR',
                            data: cdldojistarData,
                            type: 'flags',
                            //dataGrouping: series.options.dataGrouping,
                            //yAxis: 'cdldojistar'+ uniqueID,
                            //opposite: series.options.opposite,
                            //color: cdldojistarOptions.stroke,
                            //lineWidth: cdldojistarOptions.strokeWidth,
                            //dashStyle: cdldojistarOptions.dashStyle,
              							onSeries: seriesID,
              							shape: 'flag',
              							turboThreshold: 0
                        }, false, false);

                        $(cdldojistarSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdldojistar',
                            parentSeriesID: cdldojistarOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLDOJISTAR = function (uniqueID) {
                    var chart = this.chart;
                    cdldojistarOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdldojistarSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLDOJISTAR = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        isValidUniqueID : cdldojistarOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdldojistareed, options, redraw, shift, animation) {

                    pcdldojistareed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdldojistarOptionsMap, this.options.id)) {
                        updateCDLDOJISTARSeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdldojistareed, options, redraw, animation) {

                    pcdldojistareed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdldojistarOptionsMap, this.series.options.id)) {
                        updateCDLDOJISTARSeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLDOJISTARSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLDOJISTAR data point
                    for (var key in cdldojistarSeriesMap) {
                        if (cdldojistarSeriesMap[key] && cdldojistarSeriesMap[key].options && cdldojistarSeriesMap[key].options.data && cdldojistarSeriesMap[key].options.data.length > 0
                            && cdldojistarOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLDOJISTAR series. Add one more CDLDOJISTAR point
                            //Calculate CDLDOJISTAR data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdldojistarOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLDOJISTAR - start
								var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //console.log('Roc : ' + cdldojistarValue);
                                //Calculate CDLDOJISTAR - end
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
								for (var sIndx = cdldojistarSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
									if ((cdldojistarSeriesMap[key].data[sIndx].x || cdldojistarSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
										whereToUpdate = sIndx;
										break;
									}
								}
								if (bullBearData) {
	                                if (isPointUpdate)
	                                {
										if (whereToUpdate >= 0)
	                                    {
											cdldojistarSeriesMap[key].data[whereToUpdate].remove();
										}
	                                }
                                    cdldojistarSeriesMap[key].addPoint(bullBearData);
								} else {
									if (whereToUpdate>=0)
									{
										cdldojistarSeriesMap[key].data[whereToUpdate].remove();
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
