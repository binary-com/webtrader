/**
 * Created by arnab on 3/22/15
 */
define(['charts/indicators/highcharts_custom/indicator_base', 'highstock'], function (indicatorBase) {

    var cdlabandonedbabyOptionsMap = {}, cdlabandonedbabySeriesMap = {};

  	function calculateIndicatorValue(data, index) {
  		var candleOne_Index = index;
  		var candleTwo_Index = index - 1;
  		var candleThree_Index = index - 2;

      var candleThree_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleThree_Index),
          candleThree_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleThree_Index),
          candleThree_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleThree_Index),
          candleThree_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleThree_Index)
        ;
  		var candleTwo_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleTwo_Index),
          candleTwo_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleTwo_Index),
          candleTwo_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleTwo_Index),
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

      var dojiResponse_candleTwo = indicatorBase.isDoji({
        open : candleTwo_Open,
        high : candleTwo_High,
        low : candleTwo_Low,
        close : candleTwo_Close
      });

  		var isBearishContinuation = isCandleThree_Bullish
  					&& dojiResponse_candleTwo.isBear && candleTwo_Low > candleThree_High
  					&& isCandleOne_Bearish && candleTwo_Low > candleOne_High
  					;

  		var isBullishContinuation = isCandleThree_Bearish
  					&& dojiResponse_candleTwo.isBull && candleTwo_High < candleThree_Low
  					&& isCandleOne_Bullish && candleTwo_High < candleOne_Low
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
                if (!H || H.Series.prototype.addCDLABANDONEDBABY) return;

                H.Series.prototype.addCDLABANDONEDBABY = function ( cdlabandonedbabyOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlabandonedbabyOptions = $.extend({
                        //stroke : 'red',
                        //strokeWidth : 2,
                        //dashStyle : 'line',
                        //levels : [],
                        parentSeriesID : seriesID
                    }, cdlabandonedbabyOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLABANDONEDBABY series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDLABANDONEDBABY data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdlabandonedbabyData = [];
                        for (var index = 2; index < data.length; index++)
                        {

                            //Calculate CDLABANDONEDBABY - start
              							var bull_bear = calculateIndicatorValue(data, index);
              							var isBullishContinuation = bull_bear.isBullishContinuation,
              								isBearishContinuation = bull_bear.isBearishContinuation;

              							if (isBullishContinuation) {
              								cdlabandonedbabyData.push({
              									x : data[index].x || data[index][0],
              									title : '<span style="color : blue">AB</span>',
              									text : 'Abandoned Baby : Bull'
              								});
              							}
              							if (isBearishContinuation) {
              								cdlabandonedbabyData.push({
              									x : data[index].x || data[index][0],
              									title : '<span style="color : red">AB</span>',
              									text : 'Abandoned Bay : Bear'
              								});
              							}
                            //Calculate CDLABANDONEDBABY - end

                        }

                        var chart = this.chart;

                        cdlabandonedbabyOptionsMap[uniqueID] = cdlabandonedbabyOptions;


                        var series = this;
                        cdlabandonedbabySeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLABANDONEDBABY(' + cdlabandonedbabyOptions.period  + ')',
                            data: cdlabandonedbabyData,
                            type: 'flags',
                            //dataGrouping: series.options.dataGrouping,
                            //yAxis: 'cdlabandonedbaby'+ uniqueID,
                            //opposite: series.options.opposite,
                            //color: cdlabandonedbabyOptions.stroke,
                            //lineWidth: cdlabandonedbabyOptions.strokeWidth,
                            //dashStyle: cdlabandonedbabyOptions.dashStyle,
              							onSeries: seriesID,
              							shape: 'flag',
              							turboThreshold: 0
                        }, false, false);

                        $(cdlabandonedbabySeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlabandonedbaby',
                            parentSeriesID: cdlabandonedbabyOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLABANDONEDBABY = function (uniqueID) {
                    var chart = this.chart;
                    cdlabandonedbabyOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlabandonedbabySeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdlabandonedbabyeed, options, redraw, shift, animation) {

                    pcdlabandonedbabyeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlabandonedbabyOptionsMap, this.options.id)) {
                        updateCDLABANDONEDBABYSeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdlabandonedbabyeed, options, redraw, animation) {

                    pcdlabandonedbabyeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlabandonedbabyOptionsMap, this.series.options.id)) {
                        updateCDLABANDONEDBABYSeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLABANDONEDBABYSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLABANDONEDBABY data point
                    for (var key in cdlabandonedbabySeriesMap) {
                        if (cdlabandonedbabySeriesMap[key] && cdlabandonedbabySeriesMap[key].options && cdlabandonedbabySeriesMap[key].options.data && cdlabandonedbabySeriesMap[key].options.data.length > 0
                            && cdlabandonedbabyOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is CDLABANDONEDBABY series. Add one more CDLABANDONEDBABY point
                            //Calculate CDLABANDONEDBABY data
                            //Find the data point
                            var data = series.options.data;
                            var n = cdlabandonedbabyOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate CDLABANDONEDBABY - start
            								var bull_bear = calculateIndicatorValue(data, dataPointIndex);
                                            //console.log('Roc : ' + cdlabandonedbabyValue);
                                            //Calculate CDLABANDONEDBABY - end
            								var bullBearData = null;
            								if (bull_bear.isBullishContinuation) {
            									bullBearData = {
            											x : data[dataPointIndex].x || data[dataPointIndex][0],
            											title : '<span style="color : blue">AB</span>',
            											text : 'Abandoned Baby : Bull'
            									}
            								} else if (bull_bear.isBearishContinuation) {
            									bullBearData = {
            											x : data[dataPointIndex].x || data[dataPointIndex][0],
            											title : '<span style="color : red">AB</span>',
            											text : 'Abandoned Baby : Bear'
            									}
            								}

            								var whereToUpdate = -1;
            								for (var sIndx = cdlabandonedbabySeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
            									if ((cdlabandonedbabySeriesMap[key].data[sIndx].x || cdlabandonedbabySeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
            										whereToUpdate = sIndx;
            										break;
            									}
            								}
            								if (bullBearData) {
            	                                if (isPointUpdate)
            	                                {
            										if (whereToUpdate >= 0)
            	                                    {
            											cdlabandonedbabySeriesMap[key].data[whereToUpdate].remove();
            										}
            	                                }
                                                cdlabandonedbabySeriesMap[key].addPoint(bullBearData);
            								} else {
            									if (whereToUpdate>=0)
            									{
            										cdlabandonedbabySeriesMap[key].data[whereToUpdate].remove();
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
