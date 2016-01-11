/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdl2crowsOptionsMap = {}, cdl2crowsSeriesMap = {};
	
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
			
		var isBearishContinuation = isCandleThree_Bullish
					                && isCandleTwo_Bearish && (candleTwo_Open > candleThree_Close && candleTwo_Close > candleThree_Close)
					                && isCandleOne_Bearish
						            && (candleOne_Open < candleTwo_Open && candleOne_Open > candleTwo_Close) //opens within the prior candle's body
						            && (candleOne_Close < candleThree_Close && candleOne_Close > candleThree_Open); //and closes within the body of the first candle in the pattern
											
		var isBullishContinuation = isCandleThree_Bearish
				                    && isCandleTwo_Bullish && (candleTwo_Open < candleThree_Close && candleTwo_Close < candleThree_Close)
				                    && isCandleOne_Bullish
				                    && (candleOne_Open > candleTwo_Open && candleOne_Open < candleTwo_Close) //opens within the prior candle's body
				                    && (candleOne_Close > candleThree_Close && candleOne_Close < candleThree_Open); //and closes within the body of the first candle in the pattern
			
		
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
                if (!H || H.Series.prototype.addCDL2CROWS) return;

                H.Series.prototype.addCDL2CROWS = function ( cdl2crowsOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdl2crowsOptions = $.extend({
                        //stroke : 'red',
                        //strokeWidth : 2,
                        //dashStyle : 'line',
                        //levels : [],
                        parentSeriesID : seriesID
                    }, cdl2crowsOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDL2CROWS series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDL2CROWS data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdl2crowsData = [];
                        for (var index = 2; index < data.length; index++)
                        {
							
                            //Calculate CDL2CROWS - start
							var bull_bear = calculateIndicatorValue(data, index);
							var isBullishContinuation = bull_bear.isBullishContinuation,
								isBearishContinuation = bull_bear.isBearishContinuation;
							
							if (isBullishContinuation) {
								cdl2crowsData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : blue">TC</span>',
									text : 'Two crows : Bull'
								});
							}
							if (isBearishContinuation) {
								cdl2crowsData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : red">TC</span>',
									text : 'Two crows : Bear'
								});
							}
                            //Calculate CDL2CROWS - end

                        }

                        var chart = this.chart;

                        cdl2crowsOptionsMap[uniqueID] = cdl2crowsOptions;

                        
                        var series = this;
                        cdl2crowsSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDL2CROWS',
                            data: cdl2crowsData,
                            type: 'flags',
                            //dataGrouping: series.options.dataGrouping,
                            //yAxis: 'cdl2crows'+ uniqueID,
                            //opposite: series.options.opposite,
                            //color: cdl2crowsOptions.stroke,
                            //lineWidth: cdl2crowsOptions.strokeWidth,
                            //dashStyle: cdl2crowsOptions.dashStyle,
							onSeries: seriesID,
							shape: 'flag',
							turboThreshold: 0
                        }, false, false);

                        $(cdl2crowsSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdl2crows',
                            parentSeriesID: cdl2crowsOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDL2CROWS = function (uniqueID) {
                    var chart = this.chart;
                    cdl2crowsOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdl2crowsSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

				H.Series.prototype.preRemovalCheckCDL2CROWS = function(uniqueID) {
					return {
						isMainIndicator : true,
						isValidUniqueID : cdl2crowsOptionsMap[uniqueID] != null
					};
				};

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdl2crowseed, options, redraw, shift, animation) {

                    pcdl2crowseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl2crowsOptionsMap, this.options.id)) {
                        updateCDL2CROWSSeries.call(this, options[0], false);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdl2crowseed, options, redraw, animation) {

                    pcdl2crowseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl2crowsOptionsMap, this.series.options.id)) {
                        updateCDL2CROWSSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDL2CROWSSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDL2CROWS data point
                    for (var key in cdl2crowsSeriesMap) {
                        if (cdl2crowsSeriesMap[key] && cdl2crowsSeriesMap[key].options && cdl2crowsSeriesMap[key].options.data && cdl2crowsSeriesMap[key].options.data.length > 0
                            && cdl2crowsOptionsMap[key].parentSeriesID == series.options.id
							&& cdl2crowsSeriesMap[key].chart === chart
						) {
                            //This is CDL2CROWS series. Add one more CDL2CROWS point
                            //Calculate CDL2CROWS data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdl2crowsOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDL2CROWS - start
								var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //console.log('Roc : ' + cdl2crowsValue);
                                //Calculate CDL2CROWS - end
								var bullBearData = null;
								if (bull_bear.isBullishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : blue">TC</span>',
											text : 'Two crows : Bull'
									}
								} else if (bull_bear.isBearishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : red">TC</span>',
											text : 'Two crows : Bear'
									}
								}

								var whereToUpdate = -1;
								for (var sIndx = cdl2crowsSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
									if ((cdl2crowsSeriesMap[key].data[sIndx].x || cdl2crowsSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
										whereToUpdate = sIndx;
										break;
									}
								}
								if (bullBearData) {
	                                if (isPointUpdate)
	                                {
										if (whereToUpdate >= 0)
	                                    {
											cdl2crowsSeriesMap[key].data[whereToUpdate].remove();
										}
	                                }
                                    cdl2crowsSeriesMap[key].addPoint(bullBearData);
								} else {
									if (whereToUpdate>=0)
									{
										cdl2crowsSeriesMap[key].data[whereToUpdate].remove();
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
