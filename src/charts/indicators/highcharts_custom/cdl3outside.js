/**
 * Created by arnab on 3/22/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdl3outsideOptionsMap = {}, cdl3outsideSeriesMap = {};
	
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
					&& isCandleTwo_Bearish && candleTwo_Open > candleThree_Close && candleTwo_Close < candleThree_Open
					&& isCandleOne_Bearish
					;
											
		var isBullishContinuation = isCandleThree_Bearish
					&& isCandleTwo_Bullish && candleTwo_Open < candleThree_Close && candleTwo_Close > candleThree_Open
					&& isCandleOne_Bullish
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
                if (!H || H.Series.prototype.addCDL3OUTSIDE) return;

                H.Series.prototype.addCDL3OUTSIDE = function ( cdl3outsideOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdl3outsideOptions = $.extend({
                        //stroke : 'red',
                        //strokeWidth : 2,
                        //dashStyle : 'line',
                        //levels : [],
                        parentSeriesID : seriesID
                    }, cdl3outsideOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDL3OUTSIDE series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDL3OUTSIDE data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdl3outsideData = [];
                        for (var index = 2; index < data.length; index++)
                        {
							
                            //Calculate CDL3OUTSIDE - start
							var bull_bear = calculateIndicatorValue(data, index);
							var isBullishContinuation = bull_bear.isBullishContinuation,
								isBearishContinuation = bull_bear.isBearishContinuation;
							
							if (isBullishContinuation) {
								cdl3outsideData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : blue">TOUD</span>',
									text : 'Three Outside Up/Down : Bull'
								});
							}
							if (isBearishContinuation) {
								cdl3outsideData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : red">TOUD</span>',
									text : 'Three Outside Up/Down : Bear'
								});
							}
                            //Calculate CDL3OUTSIDE - end

                        }

                        var chart = this.chart;

                        cdl3outsideOptionsMap[uniqueID] = cdl3outsideOptions;

                        
                        var series = this;
                        cdl3outsideSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDL3OUTSIDE',
                            data: cdl3outsideData,
                            type: 'flags',
                            //dataGrouping: series.options.dataGrouping,
                            //yAxis: 'cdl3outside'+ uniqueID,
                            //opposite: series.options.opposite,
                            //color: cdl3outsideOptions.stroke,
                            //lineWidth: cdl3outsideOptions.strokeWidth,
                            //dashStyle: cdl3outsideOptions.dashStyle,
							onSeries: seriesID,
							shape: 'flag',
							turboThreshold: 0
                        }, false, false);

                        $(cdl3outsideSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdl3outside',
                            parentSeriesID: cdl3outsideOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDL3OUTSIDE = function (uniqueID) {
                    var chart = this.chart;
                    cdl3outsideOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdl3outsideSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

				H.Series.prototype.preRemovalCheckCDL3OUTSIDE = function(uniqueID) {
					return {
						isMainIndicator : true,
						isValidUniqueID : cdl3outsideOptionsMap[uniqueID] != null
					};
				};

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdl3outsideeed, options, redraw, shift, animation) {

                    pcdl3outsideeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl3outsideOptionsMap, this.options.id)) {
                        updateCDL3OUTSIDESeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdl3outsideeed, options, redraw, animation) {

                    pcdl3outsideeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl3outsideOptionsMap, this.series.options.id)) {
                        updateCDL3OUTSIDESeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDL3OUTSIDESeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDL3OUTSIDE data point
                    for (var key in cdl3outsideSeriesMap) {
                        if (cdl3outsideSeriesMap[key] && cdl3outsideSeriesMap[key].options && cdl3outsideSeriesMap[key].options.data && cdl3outsideSeriesMap[key].options.data.length > 0
                            && cdl3outsideOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDL3OUTSIDE series. Add one more CDL3OUTSIDE point
                            //Calculate CDL3OUTSIDE data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdl3outsideOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDL3OUTSIDE - start
								var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //console.log('Roc : ' + cdl3outsideValue);
                                //Calculate CDL3OUTSIDE - end
								var bullBearData = null;
								if (bull_bear.isBullishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : blue">TOUD</span>',
											text : 'Three Outside Up/Down : Bull'
									}
								} else if (bull_bear.isBearishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : red">TOUD</span>',
											text : 'Three Outside Up/Down : Bear'
									}
								}

								var whereToUpdate = -1;
								for (var sIndx = cdl3outsideSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
									if ((cdl3outsideSeriesMap[key].data[sIndx].x || cdl3outsideSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
										whereToUpdate = sIndx;
										break;
									}
								}
								if (bullBearData) {
	                                if (isPointUpdate)
	                                {
										if (whereToUpdate >= 0)
	                                    {
											cdl3outsideSeriesMap[key].data[whereToUpdate].remove();
										}
	                                }
                                    cdl3outsideSeriesMap[key].addPoint(bullBearData);
								} else {
									if (whereToUpdate>=0)
									{
										cdl3outsideSeriesMap[key].data[whereToUpdate].remove();
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
