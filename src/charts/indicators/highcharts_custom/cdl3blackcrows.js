/**
 * Created by arnab on 3/22/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdl3blackcrowsOptionsMap = {}, cdl3blackcrowsSeriesMap = {};
    var candleMediumHeight = 0;

	function calculateIndicatorValue(data, index) {
	    var candleOne_Index = index,
			candleTwo_Index = index - 1,
			candleThree_Index = index - 2;
		
		var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index),
			candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
			candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
			candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index);
		
		var	isCandleThree_Bearish = candleThree_Close < candleThree_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;
			
		var isBearishContinuation = isCandleThree_Bearish && (Math.abs(candleThree_Close - candleThree_Open) > candleMediumHeight)
					                && isCandleTwo_Bearish && (Math.abs(candleTwo_Close - candleTwo_Open) > candleMediumHeight) && (candleTwo_Open >= candleThree_Close && candleTwo_Open < candleThree_Open && candleTwo_Close < candleThree_Close)
					                && isCandleOne_Bearish && (Math.abs(candleOne_Close - candleOne_Open) > candleMediumHeight) && (candleOne_Open >= candleTwo_Close && candleOne_Open < candleTwo_Open && candleOne_Close < candleTwo_Close);

        //It's a bearish cadnlestick
		var isBullishContinuation = false
		
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
                if (!H || H.Series.prototype.addCDL3BLACKCROWS) return;

                H.Series.prototype.addCDL3BLACKCROWS = function ( cdl3blackcrowsOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdl3blackcrowsOptions = $.extend({
                        parentSeriesID : seriesID
                    }, cdl3blackcrowsOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDL3BLACKCROWS series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDL3BLACKCROWS data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        candleMediumHeight = indicatorBase.getCandleMediumHeight(data);
                        var cdl3blackcrowsData = [];
                        for (var index = 3; index < data.length; index++)
                        {
							
                            //Calculate CDL3BLACKCROWS - start
							var bull_bear = calculateIndicatorValue(data, index);
							var isBullishContinuation = bull_bear.isBullishContinuation,
								isBearishContinuation = bull_bear.isBearishContinuation;
							
							if (isBullishContinuation) {
								cdl3blackcrowsData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : blue">TBC</span>',
									text : 'Three Black crows : Bull'
								});
							}
							if (isBearishContinuation) {
								cdl3blackcrowsData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : red">TBC</span>',
									text : 'Three Black crows : Bear'
								});
							}
                            //Calculate CDL3BLACKCROWS - end

                        }

                        var chart = this.chart;

                        cdl3blackcrowsOptionsMap[uniqueID] = cdl3blackcrowsOptions;

                        
                        var series = this;
                        cdl3blackcrowsSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDL3BLACKCROWS',
                            data: cdl3blackcrowsData,
                            type: 'flags',
							onSeries: seriesID,
							shape: 'flag',
							turboThreshold: 0
                        }, false, false);

                        $(cdl3blackcrowsSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdl3blackcrows',
                            parentSeriesID: cdl3blackcrowsOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDL3BLACKCROWS = function (uniqueID) {
                    var chart = this.chart;
                    cdl3blackcrowsOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdl3blackcrowsSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

				H.Series.prototype.preRemovalCheckCDL3BLACKCROWS = function(uniqueID) {
					return {
						isMainIndicator : true,
						isValidUniqueID : cdl3blackcrowsOptionsMap[uniqueID] != null
					};
				};

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdl3blackcrowseed, options, redraw, shift, animation) {

                    pcdl3blackcrowseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl3blackcrowsOptionsMap, this.options.id)) {
                        updateCDL3BLACKCROWSSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdl3blackcrowseed, options, redraw, animation) {

                    pcdl3blackcrowseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl3blackcrowsOptionsMap, this.series.options.id)) {
                        updateCDL3BLACKCROWSSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDL3BLACKCROWSSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDL3BLACKCROWS data point
                    for (var key in cdl3blackcrowsSeriesMap) {
                        if (cdl3blackcrowsSeriesMap[key] && cdl3blackcrowsSeriesMap[key].options && cdl3blackcrowsSeriesMap[key].options.data && cdl3blackcrowsSeriesMap[key].options.data.length > 0
                            && cdl3blackcrowsOptionsMap[key].parentSeriesID == series.options.id
							&& cdl3blackcrowsSeriesMap[key].chart === chart
						) {
                            //This is CDL3BLACKCROWS series. Add one more CDL3BLACKCROWS point
                            //Calculate CDL3BLACKCROWS data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdl3blackcrowsOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDL3BLACKCROWS - start
								var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //Calculate CDL3BLACKCROWS - end
								var bullBearData = null;
								if (bull_bear.isBullishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : blue">TBC</span>',
											text : 'Three Black crows : Bull'
									}
								} else if (bull_bear.isBearishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : red">TBC</span>',
											text : 'Three Black crows : Bear'
									}
								}

								var whereToUpdate = -1;
								for (var sIndx = cdl3blackcrowsSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
									if ((cdl3blackcrowsSeriesMap[key].data[sIndx].x || cdl3blackcrowsSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
										whereToUpdate = sIndx;
										break;
									}
								}
								if (bullBearData) {
	                                if (isPointUpdate)
	                                {
										if (whereToUpdate >= 0)
	                                    {
											cdl3blackcrowsSeriesMap[key].data[whereToUpdate].remove();
										}
	                                }
                                    cdl3blackcrowsSeriesMap[key].addPoint(bullBearData);
								} else {
									if (whereToUpdate>=0)
									{
										cdl3blackcrowsSeriesMap[key].data[whereToUpdate].remove();
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
