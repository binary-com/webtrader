/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

  var cdlclosingmarubozuOptionsMap = {}, cdlclosingmarubozuSeriesMap = {};

	function calculateIndicatorValue(data, index) {
		var candleOne_Index = index;

		var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
        candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
        candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
        candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index)
      ;
    var isBearish = candleOne_Open > candleOne_Close;
    var isBullish = candleOne_Open < candleOne_Close;

		return {
       isBearishContinuation : isBearish && candleOne_Low == candleOne_Close,
       isBullishContinuation : isBullish && candleOne_High == candleOne_Close
		};
	}

    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addCDLCLOSINGMARUBOZU) return;

                H.Series.prototype.addCDLCLOSINGMARUBOZU = function ( cdlclosingmarubozuOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlclosingmarubozuOptions = $.extend({
                        //stroke : 'red',
                        //strokeWidth : 2,
                        //dashStyle : 'line',
                        //levels : [],
                        parentSeriesID : seriesID
                    }, cdlclosingmarubozuOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLCLOSINGMARUBOZU series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDLCLOSINGMARUBOZU data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdlclosingmarubozuData = [];
                        for (var index = 1; index < data.length; index++)
                        {

                          //Calculate CDLCLOSINGMARUBOZU - start
            							var bull_bear = calculateIndicatorValue(data, index);
            							var isBullishContinuation = bull_bear.isBullishContinuation,
            								isBearishContinuation = bull_bear.isBearishContinuation;

            							if (isBullishContinuation) {
            								cdlclosingmarubozuData.push({
            									x : data[index].x || data[index][0],
            									title : '<span style="color : blue">CM</span>',
            									text : 'Closing Marubozu : Bull'
            								});
            							}
            							if (isBearishContinuation) {
            								cdlclosingmarubozuData.push({
            									x : data[index].x || data[index][0],
            									title : '<span style="color : red">CM</span>',
            									text : 'Closing Marubozu : Bear'
            								});
            							}
                          //Calculate CDLCLOSINGMARUBOZU - end

                        }

                        var chart = this.chart;

                        cdlclosingmarubozuOptionsMap[uniqueID] = cdlclosingmarubozuOptions;


                        var series = this;
                        cdlclosingmarubozuSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLCLOSINGMARUBOZU(' + cdlclosingmarubozuOptions.period  + ')',
                            data: cdlclosingmarubozuData,
                            type: 'flags',
                            //dataGrouping: series.options.dataGrouping,
                            //yAxis: 'cdlclosingmarubozu'+ uniqueID,
                            //opposite: series.options.opposite,
                            //color: cdlclosingmarubozuOptions.stroke,
                            //lineWidth: cdlclosingmarubozuOptions.strokeWidth,
                            //dashStyle: cdlclosingmarubozuOptions.dashStyle,
              							onSeries: seriesID,
              							shape: 'flag',
              							turboThreshold: 0
                        }, false, false);

                        $(cdlclosingmarubozuSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlclosingmarubozu',
                            parentSeriesID: cdlclosingmarubozuOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLCLOSINGMARUBOZU = function (uniqueID) {
                    var chart = this.chart;
                    cdlclosingmarubozuOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlclosingmarubozuSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdlclosingmarubozueed, options, redraw, shift, animation) {

                    pcdlclosingmarubozueed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlclosingmarubozuOptionsMap, this.options.id)) {
                        updateCDLCLOSINGMARUBOZUSeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdlclosingmarubozueed, options, redraw, animation) {

                    pcdlclosingmarubozueed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlclosingmarubozuOptionsMap, this.series.options.id)) {
                        updateCDLCLOSINGMARUBOZUSeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLCLOSINGMARUBOZUSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLCLOSINGMARUBOZU data point
                    for (var key in cdlclosingmarubozuSeriesMap) {
                        if (cdlclosingmarubozuSeriesMap[key] && cdlclosingmarubozuSeriesMap[key].options && cdlclosingmarubozuSeriesMap[key].options.data && cdlclosingmarubozuSeriesMap[key].options.data.length > 0
                            && cdlclosingmarubozuOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLCLOSINGMARUBOZU series. Add one more CDLCLOSINGMARUBOZU point
                            //Calculate CDLCLOSINGMARUBOZU data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdlclosingmarubozuOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLCLOSINGMARUBOZU - start
								                var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                //console.log('Roc : ' + cdlclosingmarubozuValue);
                                //Calculate CDLCLOSINGMARUBOZU - end
                								var bullBearData = null;
                								if (bull_bear.isBullishContinuation) {
                									bullBearData = {
                											x : data[dataPointIndex].x || data[dataPointIndex][0],
                											title : '<span style="color : blue">CM</span>',
                											text : 'Closing Marubozu : Bull'
                									}
                								} else if (bull_bear.isBearishContinuation) {
                									bullBearData = {
                											x : data[dataPointIndex].x || data[dataPointIndex][0],
                											title : '<span style="color : red">CM</span>',
                											text : 'Closing Marubozu : Bear'
                									}
                								}

                								var whereToUpdate = -1;
                								for (var sIndx = cdlclosingmarubozuSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
                									if ((cdlclosingmarubozuSeriesMap[key].data[sIndx].x || cdlclosingmarubozuSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
                										whereToUpdate = sIndx;
                										break;
                									}
                								}
                								if (bullBearData) {
                	                                if (isPointUpdate)
                	                                {
                										if (whereToUpdate >= 0)
                	                                    {
                											cdlclosingmarubozuSeriesMap[key].data[whereToUpdate].remove();
                										}
                	                                }
                                                    cdlclosingmarubozuSeriesMap[key].addPoint(bullBearData);
                								} else {
                									if (whereToUpdate>=0)
                									{
                										cdlclosingmarubozuSeriesMap[key].data[whereToUpdate].remove();
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
