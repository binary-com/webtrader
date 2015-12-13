/**
 * Created by arnab on 3/22/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdl3starssouthOptionsMap = {}, cdl3starssouthSeriesMap = {};

	function calculateIndicatorValue(data, index) {
		var candleOne_Index = index;
		var candleTwo_Index = index - 1;
		var candleThree_Index = index - 2;

		var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
  			candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index),
        candleThree_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleThree_Index)
      ;
		var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
        candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
        candleTwo_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleTwo_Index)
      ;
		var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
  			candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
        candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
        candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index)
      ;

		var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
			isCandleThree_Bearish = candleThree_Close < candleThree_Open;
		var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
		var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

		var isBearishContinuation = isCandleThree_Bullish
					&& isCandleTwo_Bullish && (candleTwo_Low < candleThree_Low)
					&& isCandleOne_Bullish && candleOne_Open == candleOne_Low && candleOne_High == candleOne_Close
					;

		var isBullishContinuation = isCandleThree_Bearish
					&& isCandleTwo_Bearish && (candleTwo_Low > candleThree_Low)
					&& isCandleOne_Bearish && candleOne_Open == candleOne_High && candleOne_Low == candleOne_Close
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
                if (!H || H.Series.prototype.addCDL3STARSSOUTH) return;

                H.Series.prototype.addCDL3STARSSOUTH = function ( cdl3starssouthOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdl3starssouthOptions = $.extend({
                        //stroke : 'red',
                        //strokeWidth : 2,
                        //dashStyle : 'line',
                        //levels : [],
                        parentSeriesID : seriesID
                    }, cdl3starssouthOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDL3STARSSOUTH series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDL3STARSSOUTH data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdl3starssouthData = [];
                        for (var index = 2; index < data.length; index++)
                        {

                            //Calculate CDL3STARSSOUTH - start
							var bull_bear = calculateIndicatorValue(data, index);
							var isBullishContinuation = bull_bear.isBullishContinuation,
								isBearishContinuation = bull_bear.isBearishContinuation;

							if (isBullishContinuation) {
								cdl3starssouthData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : blue">TSS</span>',
									text : 'Three Stars In The South : Bull'
								});
							}
							if (isBearishContinuation) {
								cdl3starssouthData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : red">TSS</span>',
									text : 'Three Stars In The South : Bear'
								});
							}
                            //Calculate CDL3STARSSOUTH - end

                        }

                        var chart = this.chart;

                        cdl3starssouthOptionsMap[uniqueID] = cdl3starssouthOptions;


                        var series = this;
                        cdl3starssouthSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDL3STARSSOUTH',
                            data: cdl3starssouthData,
                            type: 'flags',
                            //dataGrouping: series.options.dataGrouping,
                            //yAxis: 'cdl3starssouth'+ uniqueID,
                            //opposite: series.options.opposite,
                            //color: cdl3starssouthOptions.stroke,
                            //lineWidth: cdl3starssouthOptions.strokeWidth,
                            //dashStyle: cdl3starssouthOptions.dashStyle,
							onSeries: seriesID,
							shape: 'flag',
							turboThreshold: 0
                        }, false, false);

                        $(cdl3starssouthSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdl3starssouth',
                            parentSeriesID: cdl3starssouthOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDL3STARSSOUTH = function (uniqueID) {
                    var chart = this.chart;
                    cdl3starssouthOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdl3starssouthSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

				H.Series.prototype.preRemovalCheckCDL3STARSSOUTH = function(uniqueID) {
					return {
						isMainIndicator : true,
						isValidUniqueID : cdl3starssouthOptionsMap[uniqueID] != null
					};
				};

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdl3starssoutheed, options, redraw, shift, animation) {

                    pcdl3starssoutheed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl3starssouthOptionsMap, this.options.id)) {
                        updateCDL3STARSSOUTHSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdl3starssoutheed, options, redraw, animation) {

                    pcdl3starssoutheed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl3starssouthOptionsMap, this.series.options.id)) {
                        updateCDL3STARSSOUTHSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDL3STARSSOUTHSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDL3STARSSOUTH data point
                    for (var key in cdl3starssouthSeriesMap) {
                        if (cdl3starssouthSeriesMap[key] && cdl3starssouthSeriesMap[key].options && cdl3starssouthSeriesMap[key].options.data && cdl3starssouthSeriesMap[key].options.data.length > 0
                            && cdl3starssouthOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDL3STARSSOUTH series. Add one more CDL3STARSSOUTH point
                            //Calculate CDL3STARSSOUTH data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdl3starssouthOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDL3STARSSOUTH - start
								var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //console.log('Roc : ' + cdl3starssouthValue);
                                //Calculate CDL3STARSSOUTH - end
								var bullBearData = null;
								if (bull_bear.isBullishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : blue">TSS</span>',
											text : 'Three Stars In The South : Bull'
									}
								} else if (bull_bear.isBearishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : red">TSS</span>',
											text : 'Three Stars In The South : Bear'
									}
								}

								var whereToUpdate = -1;
								for (var sIndx = cdl3starssouthSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
									if ((cdl3starssouthSeriesMap[key].data[sIndx].x || cdl3starssouthSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
										whereToUpdate = sIndx;
										break;
									}
								}
								if (bullBearData) {
	                                if (isPointUpdate)
	                                {
										if (whereToUpdate >= 0)
	                                    {
											cdl3starssouthSeriesMap[key].data[whereToUpdate].remove();
										}
	                                }
                                    cdl3starssouthSeriesMap[key].addPoint(bullBearData);
								} else {
									if (whereToUpdate>=0)
									{
										cdl3starssouthSeriesMap[key].data[whereToUpdate].remove();
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
