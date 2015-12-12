/**
 * Created by arnab on 3/22/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdl3insideOptionsMap = {}, cdl3insideSeriesMap = {};
	
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
					&& isCandleTwo_Bearish && (candleTwo_Close >= (candleThree_Close - Math.abs(candleThree_Open - candleThree_Close) / 2) /*&& candleTwo_Close > candleThree_Close*/)
					&& isCandleOne_Bearish && (candleOne_Close < candleThree_Open)
					;
											
		var isBullishContinuation = isCandleThree_Bearish
					&& isCandleTwo_Bullish && (candleTwo_Close <= (candleThree_Close + Math.abs(candleThree_Open - candleThree_Close) / 2) /*&& candleTwo_Close < candleThree_Close*/)
					&& isCandleOne_Bullish && (candleOne_Close > candleThree_Open)
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
                if (!H || H.Series.prototype.addCDL3INSIDE) return;

                H.Series.prototype.addCDL3INSIDE = function ( cdl3insideOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdl3insideOptions = $.extend({
                        //stroke : 'red',
                        //strokeWidth : 2,
                        //dashStyle : 'line',
                        //levels : [],
                        parentSeriesID : seriesID
                    }, cdl3insideOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDL3INSIDE series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDL3INSIDE data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdl3insideData = [];
                        for (var index = 2; index < data.length; index++)
                        {
							
                            //Calculate CDL3INSIDE - start
							var bull_bear = calculateIndicatorValue(data, index);
							var isBullishContinuation = bull_bear.isBullishContinuation,
								isBearishContinuation = bull_bear.isBearishContinuation;
							
							if (isBullishContinuation) {
								cdl3insideData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : blue">TIUD</span>',
									text : 'Three Inside Up/Down : Bull'
								});
							}
							if (isBearishContinuation) {
								cdl3insideData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : red">TIUD</span>',
									text : 'Three Inside Up/Down : Bear'
								});
							}
                            //Calculate CDL3INSIDE - end

                        }

                        var chart = this.chart;

                        cdl3insideOptionsMap[uniqueID] = cdl3insideOptions;

                        
                        var series = this;
                        cdl3insideSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDL3INSIDE',
                            data: cdl3insideData,
                            type: 'flags',
                            //dataGrouping: series.options.dataGrouping,
                            //yAxis: 'cdl3inside'+ uniqueID,
                            //opposite: series.options.opposite,
                            //color: cdl3insideOptions.stroke,
                            //lineWidth: cdl3insideOptions.strokeWidth,
                            //dashStyle: cdl3insideOptions.dashStyle,
							onSeries: seriesID,
							shape: 'flag',
							turboThreshold: 0
                        }, false, false);

                        $(cdl3insideSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdl3inside',
                            parentSeriesID: cdl3insideOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDL3INSIDE = function (uniqueID) {
                    var chart = this.chart;
                    cdl3insideOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdl3insideSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

				H.Series.prototype.preRemovalCheckCDL3INSIDE = function(uniqueID) {
					return {
						isMainIndicator : true,
						isValidUniqueID : cdl3insideOptionsMap[uniqueID] != null
					};
				};

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdl3insideeed, options, redraw, shift, animation) {

                    pcdl3insideeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl3insideOptionsMap, this.options.id)) {
                        updateCDL3INSIDESeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdl3insideeed, options, redraw, animation) {

                    pcdl3insideeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl3insideOptionsMap, this.series.options.id)) {
                        updateCDL3INSIDESeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDL3INSIDESeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDL3INSIDE data point
                    for (var key in cdl3insideSeriesMap) {
                        if (cdl3insideSeriesMap[key] && cdl3insideSeriesMap[key].options && cdl3insideSeriesMap[key].options.data && cdl3insideSeriesMap[key].options.data.length > 0
                            && cdl3insideOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDL3INSIDE series. Add one more CDL3INSIDE point
                            //Calculate CDL3INSIDE data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdl3insideOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate CDL3INSIDE - start
								var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //console.log('Roc : ' + cdl3insideValue);
                                //Calculate CDL3INSIDE - end
								var bullBearData = null;
								if (bull_bear.isBullishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : blue">TIUD</span>',
											text : 'Three Inside Up/Down : Bull'
									}
								} else if (bull_bear.isBearishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : red">TIUD</span>',
											text : 'Three Inside Up/Down : Bear'
									}
								}

								var whereToUpdate = -1;
								for (var sIndx = cdl3insideSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
									if ((cdl3insideSeriesMap[key].data[sIndx].x || cdl3insideSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
										whereToUpdate = sIndx;
										break;
									}
								}
								if (bullBearData) {
	                                if (isPointUpdate)
	                                {
										if (whereToUpdate >= 0)
	                                    {
											cdl3insideSeriesMap[key].data[whereToUpdate].remove();
										}
	                                }
                                    cdl3insideSeriesMap[key].addPoint(bullBearData);
								} else {
									if (whereToUpdate>=0)
									{
										cdl3insideSeriesMap[key].data[whereToUpdate].remove();
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
