/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

  var cdldojiOptionsMap = {}, cdldojiSeriesMap = {};

	function calculateIndicatorValue(data, index) {
		var candleOne_Index = index;

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

		return {
			isBullishContinuation : response.isBull,
			isBearishContinuation : response.isBear
		};
	}

    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addCDLDOJI) return;

                H.Series.prototype.addCDLDOJI = function ( cdldojiOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdldojiOptions = $.extend({
                        //stroke : 'red',
                        //strokeWidth : 2,
                        //dashStyle : 'line',
                        //levels : [],
                        parentSeriesID : seriesID
                    }, cdldojiOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLDOJI series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDLDOJI data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdldojiData = [];
                        for (var index = 1; index < data.length; index++)
                        {

                          //Calculate CDLDOJI - start
            							var bull_bear = calculateIndicatorValue(data, index);
            							var isBullishContinuation = bull_bear.isBullishContinuation,
            								isBearishContinuation = bull_bear.isBearishContinuation;

            							if (isBullishContinuation) {
            								cdldojiData.push({
            									x : data[index].x || data[index][0],
            									title : '<span style="color : blue">D</span>',
            									text : 'Doji : Bull'
            								});
            							}
            							if (isBearishContinuation) {
            								cdldojiData.push({
            									x : data[index].x || data[index][0],
            									title : '<span style="color : red">D</span>',
            									text : 'Doji : Bear'
            								});
            							}
                          //Calculate CDLDOJI - end

                        }

                        var chart = this.chart;

                        cdldojiOptionsMap[uniqueID] = cdldojiOptions;


                        var series = this;
                        cdldojiSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLDOJI',
                            data: cdldojiData,
                            type: 'flags',
                            //dataGrouping: series.options.dataGrouping,
                            //yAxis: 'cdldoji'+ uniqueID,
                            //opposite: series.options.opposite,
                            //color: cdldojiOptions.stroke,
                            //lineWidth: cdldojiOptions.strokeWidth,
                            //dashStyle: cdldojiOptions.dashStyle,
              							onSeries: seriesID,
              							shape: 'flag',
              							turboThreshold: 0
                        }, false, false);

                        $(cdldojiSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdldoji',
                            parentSeriesID: cdldojiOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLDOJI = function (uniqueID) {
                    var chart = this.chart;
                    cdldojiOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdldojiSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLDOJI = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        isValidUniqueID : cdldojiOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdldojieed, options, redraw, shift, animation) {

                    pcdldojieed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdldojiOptionsMap, this.options.id)) {
                        updateCDLDOJISeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdldojieed, options, redraw, animation) {

                    pcdldojieed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdldojiOptionsMap, this.series.options.id)) {
                        updateCDLDOJISeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLDOJISeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLDOJI data point
                    for (var key in cdldojiSeriesMap) {
                        if (cdldojiSeriesMap[key] && cdldojiSeriesMap[key].options && cdldojiSeriesMap[key].options.data && cdldojiSeriesMap[key].options.data.length > 0
                            && cdldojiOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLDOJI series. Add one more CDLDOJI point
                            //Calculate CDLDOJI data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdldojiOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLDOJI - start
								                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //console.log('Roc : ' + cdldojiValue);
                                //Calculate CDLDOJI - end
                								var bullBearData = null;
                								if (bull_bear.isBullishContinuation) {
                									bullBearData = {
                											x : data[dataPointIndex].x || data[dataPointIndex][0],
                											title : '<span style="color : blue">D</span>',
                											text : 'Doji : Bull'
                									}
                								} else if (bull_bear.isBearishContinuation) {
                									bullBearData = {
                											x : data[dataPointIndex].x || data[dataPointIndex][0],
                											title : '<span style="color : red">D</span>',
                											text : 'Doji : Bear'
                									}
                								}

                								var whereToUpdate = -1;
                								for (var sIndx = cdldojiSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                									if ((cdldojiSeriesMap[key].data[sIndx].x || cdldojiSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                										whereToUpdate = sIndx;
                										break;
                									}
                								}
                								if (bullBearData) {
                	                                if (isPointUpdate)
                	                                {
                										if (whereToUpdate >= 0)
                	                                    {
                											cdldojiSeriesMap[key].data[whereToUpdate].remove();
                										}
                	                                }
                                                    cdldojiSeriesMap[key].addPoint(bullBearData);
                								} else {
                									if (whereToUpdate>=0)
                									{
                										cdldojiSeriesMap[key].data[whereToUpdate].remove();
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
