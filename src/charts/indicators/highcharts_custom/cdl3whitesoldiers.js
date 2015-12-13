/**
 * Created by arnab on 3/22/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdl3whitesoldiersOptionsMap = {}, cdl3whitesoldiersSeriesMap = {};

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
					&& isCandleTwo_Bullish && (candleTwo_Open > candleThree_Open && candleTwo_Open < candleThree_Close)
					&& isCandleOne_Bullish && (candleOne_Open > candleTwo_Open && candleOne_Open < candleTwo_Close)
					;

		var isBullishContinuation = isCandleThree_Bearish
          && isCandleTwo_Bearish && (candleTwo_Open < candleThree_Open && candleTwo_Open > candleThree_Close)
          && isCandleOne_Bearish && (candleOne_Open < candleTwo_Open && candleOne_Open > candleTwo_Close)
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
                if (!H || H.Series.prototype.addCDL3WHITESOLDIERS) return;

                H.Series.prototype.addCDL3WHITESOLDIERS = function ( cdl3whitesoldiersOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdl3whitesoldiersOptions = $.extend({
                        //stroke : 'red',
                        //strokeWidth : 2,
                        //dashStyle : 'line',
                        //levels : [],
                        parentSeriesID : seriesID
                    }, cdl3whitesoldiersOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDL3WHITESOLDIERS series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDL3WHITESOLDIERS data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdl3whitesoldiersData = [];
                        for (var index = 2; index < data.length; index++)
                        {

                            //Calculate CDL3WHITESOLDIERS - start
							var bull_bear = calculateIndicatorValue(data, index);
							var isBullishContinuation = bull_bear.isBullishContinuation,
								isBearishContinuation = bull_bear.isBearishContinuation;

							if (isBullishContinuation) {
								cdl3whitesoldiersData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : blue">TWS</span>',
									text : 'Three Advancing White Soldiers : Bull'
								});
							}
							if (isBearishContinuation) {
								cdl3whitesoldiersData.push({
									x : data[index].x || data[index][0],
									title : '<span style="color : red">TWS</span>',
									text : 'Three Advancing White Soldiers : Bear'
								});
							}
                            //Calculate CDL3WHITESOLDIERS - end

                        }

                        var chart = this.chart;

                        cdl3whitesoldiersOptionsMap[uniqueID] = cdl3whitesoldiersOptions;


                        var series = this;
                        cdl3whitesoldiersSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDL3WHITESOLDIERS',
                            data: cdl3whitesoldiersData,
                            type: 'flags',
                            //dataGrouping: series.options.dataGrouping,
                            //yAxis: 'cdl3whitesoldiers'+ uniqueID,
                            //opposite: series.options.opposite,
                            //color: cdl3whitesoldiersOptions.stroke,
                            //lineWidth: cdl3whitesoldiersOptions.strokeWidth,
                            //dashStyle: cdl3whitesoldiersOptions.dashStyle,
							onSeries: seriesID,
							shape: 'flag',
							turboThreshold: 0
                        }, false, false);

                        $(cdl3whitesoldiersSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdl3whitesoldiers',
                            parentSeriesID: cdl3whitesoldiersOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDL3WHITESOLDIERS = function (uniqueID) {
                    var chart = this.chart;
                    cdl3whitesoldiersOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdl3whitesoldiersSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

				H.Series.prototype.preRemovalCheckCDL3WHITESOLDIERS = function(uniqueID) {
					return {
						isMainIndicator : true,
						isValidUniqueID : cdl3whitesoldiersOptionsMap[uniqueID] != null
					};
				};

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdl3whitesoldierseed, options, redraw, shift, animation) {

                    pcdl3whitesoldierseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl3whitesoldiersOptionsMap, this.options.id)) {
                        updateCDL3WHITESOLDIERSSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdl3whitesoldierseed, options, redraw, animation) {

                    pcdl3whitesoldierseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdl3whitesoldiersOptionsMap, this.series.options.id)) {
                        updateCDL3WHITESOLDIERSSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDL3WHITESOLDIERSSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDL3WHITESOLDIERS data point
                    for (var key in cdl3whitesoldiersSeriesMap) {
                        if (cdl3whitesoldiersSeriesMap[key] && cdl3whitesoldiersSeriesMap[key].options && cdl3whitesoldiersSeriesMap[key].options.data && cdl3whitesoldiersSeriesMap[key].options.data.length > 0
                            && cdl3whitesoldiersOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDL3WHITESOLDIERS series. Add one more CDL3WHITESOLDIERS point
                            //Calculate CDL3WHITESOLDIERS data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdl3whitesoldiersOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate CDL3WHITESOLDIERS - start
								var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //console.log('Roc : ' + cdl3whitesoldiersValue);
                                //Calculate CDL3WHITESOLDIERS - end
								var bullBearData = null;
								if (bull_bear.isBullishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : blue">TWS</span>',
											text : 'Three Advancing White Soldiers : Bull'
									}
								} else if (bull_bear.isBearishContinuation) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : red">TWS</span>',
											text : 'Three Advancing White Soldiers : Bear'
									}
								}

								var whereToUpdate = -1;
								for (var sIndx = cdl3whitesoldiersSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
									if ((cdl3whitesoldiersSeriesMap[key].data[sIndx].x || cdl3whitesoldiersSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
										whereToUpdate = sIndx;
										break;
									}
								}
								if (bullBearData) {
	                                if (isPointUpdate)
	                                {
										if (whereToUpdate >= 0)
	                                    {
											cdl3whitesoldiersSeriesMap[key].data[whereToUpdate].remove();
										}
	                                }
                                    cdl3whitesoldiersSeriesMap[key].addPoint(bullBearData);
								} else {
									if (whereToUpdate>=0)
									{
										cdl3whitesoldiersSeriesMap[key].data[whereToUpdate].remove();
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
