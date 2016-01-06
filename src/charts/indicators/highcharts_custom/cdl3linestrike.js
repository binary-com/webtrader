/**
 * Created by arnab on 3/22/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdl3linestrikeOptionsMap = {}, cdl3linestrikeSeriesMap = {};
	
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
			isCandleFour_Bearish = candleFour_Close < candleFour_Open,
			isCandleThree_Bullish = candleThree_Close > candleThree_Open,
			isCandleThree_Bearish = candleThree_Close < candleThree_Open,
			isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open,
			isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;
			
		var isBullishContinuation = isCandleFour_Bearish
					&& isCandleThree_Bearish && (candleThree_Close < candleFour_Close)
					&& isCandleTwo_Bearish && (candleTwo_Close < candleThree_Close)
					&& isCandleOne_Bullish && (candleOne_Close > candleFour_Open && candleOne_Open < candleTwo_Close)
					;
											
		var isBearishContinuation = isCandleFour_Bullish
					&& isCandleThree_Bullish && (candleThree_Close > candleFour_Close)
					&& isCandleTwo_Bullish && (candleTwo_Close > candleThree_Close)
					&& isCandleOne_Bearish && (candleOne_Close < candleFour_Open && candleOne_Open < candleTwo_Close)
					;
		
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
                if (!H || H.Series.prototype.addCDL3LINESTRIKE) return;

                H.Series.prototype.addCDL3LINESTRIKE = function ( cdl3linestrikeOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdl3linestrikeOptions = $.extend({
                        //stroke : 'red',
                        //strokeWidth : 2,
                        //dashStyle : 'line',
                        //levels : [],
                        parentSeriesID : seriesID
                    }, cdl3linestrikeOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDL3LINESTRIKE series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDL3LINESTRIKE data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdl3linestrikeData = [];
                        for (var index = 3; index < data.length; index++)
                        {
							
                            //Calculate CDL3LINESTRIKE - start
							var bull_bear = calculateIndicatorValue(data, index);
							var isBullishContinuation = bull_bear.isBullishContinuation,
								isBearishContinuation = bull_bear.isBearishContinuation;
							
							if (isBullishContinuation) {
								cdl3linestrikeData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : blue">TLS</span>',
									text : 'Three-Line Strike : Bull'
								});
							}
							if (isBearishContinuation) {
								cdl3linestrikeData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : red">TLS</span>',
									text : 'Three-Line Strike : Bear'
								});
							}
                            //Calculate CDL3LINESTRIKE - end

                        }

                        var chart = this.chart;

                        cdl3linestrikeOptionsMap[uniqueID] = cdl3linestrikeOptions;

                        
                        var series = this;
                        cdl3linestrikeSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDL3LINESTRIKE',
                            data: cdl3linestrikeData,
                            type: 'flags',
                            //dataGrouping: series.options.dataGrouping,
                            //yAxis: 'cdl3linestrike'+ uniqueID,
                            //opposite: series.options.opposite,
                            //color: cdl3linestrikeOptions.stroke,
                            //lineWidth: cdl3linestrikeOptions.strokeWidth,
                            //dashStyle: cdl3linestrikeOptions.dashStyle,
							onSeries: seriesID,
							shape: 'flag',
							turboThreshold: 0
                        }, false, false);

                        $(cdl3linestrikeSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdl3linestrike',
                            parentSeriesID: cdl3linestrikeOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDL3LINESTRIKE = function (uniqueID) {
                    var chart = this.chart;
                    cdl3linestrikeOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdl3linestrikeSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

				H.Series.prototype.preRemovalCheckCDL3LINESTRIKE = function(uniqueID) {
					return {
						isMainIndicator : true,
						isValidUniqueID : cdl3linestrikeOptionsMap[uniqueID] != null
					};
				};

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdl3linestrikeeed, options, redraw, shift, animation) {

                    pcdl3linestrikeeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl3linestrikeOptionsMap, this.options.id)) {
                        updateCDL3LINESTRIKESeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdl3linestrikeeed, options, redraw, animation) {

                    pcdl3linestrikeeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl3linestrikeOptionsMap, this.series.options.id)) {
                        updateCDL3LINESTRIKESeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDL3LINESTRIKESeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDL3LINESTRIKE data point
                    for (var key in cdl3linestrikeSeriesMap) {
                        if (cdl3linestrikeSeriesMap[key] && cdl3linestrikeSeriesMap[key].options && cdl3linestrikeSeriesMap[key].options.data && cdl3linestrikeSeriesMap[key].options.data.length > 0
                            && cdl3linestrikeOptionsMap[key].parentSeriesID == series.options.id
							&& cdl3linestrikeSeriesMap[key].chart === chart
						) {
                            //This is CDL3LINESTRIKE series. Add one more CDL3LINESTRIKE point
                            //Calculate CDL3LINESTRIKE data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDL3LINESTRIKE - start
								var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //console.log('Roc : ' + cdl3linestrikeValue);
                                //Calculate CDL3LINESTRIKE - end
								var bullBearData = null;
								if (bull_bear.isBullishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : blue">TLS</span>',
											text : 'Three-Line Strike : Bull'
									}
								} else if (bull_bear.isBearishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : red">TLS</span>',
											text : 'Three-Line Strike : Bear'
									}
								}

								var whereToUpdate = -1;
								for (var sIndx = cdl3linestrikeSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
									if ((cdl3linestrikeSeriesMap[key].data[sIndx].x || cdl3linestrikeSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
										whereToUpdate = sIndx;
										break;
									}
								}
								if (bullBearData) {
	                                if (isPointUpdate)
	                                {
										if (whereToUpdate >= 0)
	                                    {
											cdl3linestrikeSeriesMap[key].data[whereToUpdate].remove();
										}
	                                }
                                    cdl3linestrikeSeriesMap[key].addPoint(bullBearData);
								} else {
									if (whereToUpdate>=0)
									{
										cdl3linestrikeSeriesMap[key].data[whereToUpdate].remove();
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
