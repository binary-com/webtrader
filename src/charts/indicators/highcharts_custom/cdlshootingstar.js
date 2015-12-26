/**
 * Created by arnab on 3/22/15
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cdlshootingstarOptionsMap = {}, cdlshootingstarSeriesMap = {};

	function calculateIndicatorValue(data, index) {
		var candleOne_Index = index;

        var candleOne_Open = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, candleOne_Index),
            candleOne_Close = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, candleOne_Index),
            candleOne_Low = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, candleOne_Index),
            candleOne_High = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, candleOne_Index)
          ;

        var perctDiff_openToClose = Math.abs((candleOne_Open - candleOne_Close) * 100.0 / candleOne_Open);
        var perctDiff_openToLow = Math.abs((candleOne_Open - candleOne_Low) * 100.0 / candleOne_Open);
        var perctDiff_closeToLow = Math.abs((candleOne_Close - candleOne_Low) * 100.0 / candleOne_Close);
        var body = Math.abs(candleOne_Open - candleOne_Close);
        var wick = candleOne_High - Math.max(candleOne_Open, candleOne_Close);
        var isShadowTwiceBody = wick >= (2.0 * body);
        var isOpenCloseLowAlmostSame = perctDiff_openToClose <= 1.0
                                        && perctDiff_openToLow <= 1.0
                                        && perctDiff_closeToLow <= 0.5;

		return isShadowTwiceBody && isOpenCloseLowAlmostSame;
	}

    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addCDLSHOOTINGSTAR) return;

                H.Series.prototype.addCDLSHOOTINGSTAR = function ( cdlshootingstarOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    cdlshootingstarOptions = $.extend({
                        //stroke : 'red',
                        //strokeWidth : 2,
                        //dashStyle : 'line',
                        //levels : [],
                        parentSeriesID : seriesID
                    }, cdlshootingstarOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add CDLSHOOTINGSTAR series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate CDLSHOOTINGSTAR data
                        /*
                         * Formula(OHLC or Candlestick) -
                            Refer to dl2crows.html for detailed information on this indicator
                         */
                        var cdlshootingstarData = [];
                        for (var index = 2; index < data.length; index++)
                        {

                            //Calculate CDLSHOOTINGSTAR - start
                            if (calculateIndicatorValue(data, index)) {
                                cdlshootingstarData.push({
                                    x : data[index].x || data[index][0],
                                    title : '<span style="color : red">SS</span>',
                                    text : 'Shooting Star'
                                });
                            }
                            //Calculate CDLSHOOTINGSTAR - end

                        }

                        var chart = this.chart;

                        cdlshootingstarOptionsMap[uniqueID] = cdlshootingstarOptions;


                        var series = this;
                        cdlshootingstarSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CDLSHOOTINGSTAR',
                            data: cdlshootingstarData,
                            type: 'flags',
                            //dataGrouping: series.options.dataGrouping,
                            //yAxis: 'cdlshootingstar'+ uniqueID,
                            //opposite: series.options.opposite,
                            //color: cdlshootingstarOptions.stroke,
                            //lineWidth: cdlshootingstarOptions.strokeWidth,
                            //dashStyle: cdlshootingstarOptions.dashStyle,
              							onSeries: seriesID,
              							shape: 'flag',
              							turboThreshold: 0
                        }, false, false);

                        $(cdlshootingstarSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'cdlshootingstar',
                            parentSeriesID: cdlshootingstarOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeCDLSHOOTINGSTAR = function (uniqueID) {
                    var chart = this.chart;
                    cdlshootingstarOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cdlshootingstarSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCDLSHOOTINGSTAR = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        isValidUniqueID : cdlshootingstarOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pcdlshootingstareed, options, redraw, shift, animation) {

                    pcdlshootingstareed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlshootingstarOptionsMap, this.options.id)) {
                        updateCDLSHOOTINGSTARSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pcdlshootingstareed, options, redraw, animation) {

                    pcdlshootingstareed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cdlshootingstarOptionsMap, this.series.options.id)) {
                        updateCDLSHOOTINGSTARSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateCDLSHOOTINGSTARSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new CDLSHOOTINGSTAR data point
                    for (var key in cdlshootingstarSeriesMap) {
                        if (cdlshootingstarSeriesMap[key] && cdlshootingstarSeriesMap[key].options && cdlshootingstarSeriesMap[key].options.data && cdlshootingstarSeriesMap[key].options.data.length > 0
                            && cdlshootingstarOptionsMap[key].parentSeriesID == series.options.id
                            && cdlshootingstarSeriesMap[key].chart === chart
                        ) {
                            //This is CDLSHOOTINGSTAR series. Add one more CDLSHOOTINGSTAR point
                            //Calculate CDLSHOOTINGSTAR data
                            //Find the data point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var bullBearData = null;
								if (calculateIndicatorValue(data, dataPointIndex)) {
									bullBearData = {
											x : data[dataPointIndex].x || data[dataPointIndex][0],
											title : '<span style="color : red">SS</span>',
											text : 'Shooting Star'
									}
								}

								var whereToUpdate = -1;
								for (var sIndx = cdlshootingstarSeriesMap[key].data.length - 1; sIndx >= 0 ; sIndx--) {
									if ((cdlshootingstarSeriesMap[key].data[sIndx].x || cdlshootingstarSeriesMap[key].data[sIndx][0]) == (data[dataPointIndex].x || data[dataPointIndex][0])) {
										whereToUpdate = sIndx;
										break;
									}
								}
								if (bullBearData) {
	                                if (isPointUpdate)
	                                {
										if (whereToUpdate >= 0)
	                                    {
											cdlshootingstarSeriesMap[key].data[whereToUpdate].remove();
										}
	                                }
                                    cdlshootingstarSeriesMap[key].addPoint(bullBearData);
								} else {
									if (whereToUpdate>=0)
									{
										cdlshootingstarSeriesMap[key].data[whereToUpdate].remove();
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
