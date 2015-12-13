/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var bopOptionsMap = {}, bopSeriesMap = {};
	
	function calculateIndicatorValue(data, index) {
        var closePrice = indicatorBase.extractPriceForAppliedTO(indicatorBase.CLOSE, data, index);
		var openPrice = indicatorBase.extractPriceForAppliedTO(indicatorBase.OPEN, data, index);
		var highPrice = indicatorBase.extractPriceForAppliedTO(indicatorBase.HIGH, data, index);
		var lowPrice = indicatorBase.extractPriceForAppliedTO(indicatorBase.LOW, data, index);
		var bopValue = (closePrice - openPrice) / (highPrice - lowPrice);
		return bopValue;
	}
    
    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addBOP) return;

                H.Series.prototype.addBOP = function ( bopOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    bopOptions = $.extend({
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        parentSeriesID : seriesID
                    }, bopOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add BOP series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate BOP data
                        /*
                         * Formula(OHLC or Candlestick) -
                            BOP = (CL - OP) / (HI - LO)
                         */
                        var bopData = [];
                        for (var index = 0; index < data.length; index++)
                        {

							var bopValue = calculateIndicatorValue(data, index);
                            //Calculate BOP - start
                            bopData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(bopValue, 5)]);
                            //Calculate BOP - end

                        }

                        var chart = this.chart;

                        bopOptionsMap[uniqueID] = bopOptions;

                        chart.addAxis({ // Secondary yAxis
                            id: 'bop'+ uniqueID,
                            title: {
                                text: 'BOP',
                                align: 'high',
                                offset: 0,
                                rotation: 0,
                                y: 10, //Trying to show title inside the indicator chart
                                x: 25
                            },
                            lineWidth: 2,
                            plotLines: bopOptions.levels
                        }, false, false, false);

                        indicatorBase.recalculate(chart);

                        var series = this;
                        bopSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'BOP',
                            data: bopData,
                            type: 'column',
                            dataGrouping: series.options.dataGrouping,
                            yAxis: 'bop'+ uniqueID,
                            opposite: series.options.opposite,
                            color: bopOptions.stroke,
                            lineWidth: bopOptions.strokeWidth,
                            dashStyle: bopOptions.dashStyle
                        }, false, false);

                        $(bopSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'bop',
                            parentSeriesID: bopOptions.parentSeriesID,
                            period: bopOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeBOP = function (uniqueID) {
                    var chart = this.chart;
                    bopOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    chart.get('bop' + uniqueID).remove(false);
                    bopSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckBOP = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        isValidUniqueID : bopOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(pbopeed, options, redraw, shift, animation) {

                    pbopeed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(bopOptionsMap, this.options.id)) {
                        updateBOPSeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(pbopeed, options, redraw, animation) {

                    pbopeed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(bopOptionsMap, this.series.options.id)) {
                        updateBOPSeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateBOPSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new BOP data point
                    for (var key in bopSeriesMap) {
                        if (bopSeriesMap[key] && bopSeriesMap[key].options && bopSeriesMap[key].options.data && bopSeriesMap[key].options.data.length > 0
                            && bopOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is BOP series. Add one more BOP point
                            //Calculate BOP data
                            /*
                             * Formula(OHLC or Candlestick) -
                                BOP = Current Price / Price of n bars ago
                                 Where: n = Time period
                             */
                            //Find the data point
                            var data = series.options.data;
                            var n = bopOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate BOP - start
								var bopValue = calculateIndicatorValue(data, dataPointIndex);
                                //console.log('Roc : ' + bopValue);
                                //Calculate BOP - end
                                bopValue = indicatorBase.toFixed(bopValue , 5);

                                if (isPointUpdate)
                                {
                                    bopSeriesMap[key].data[dataPointIndex].update({ y : bopValue});
                                }
                                else
                                {
                                    bopSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), bopValue], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery,indicatorBase);

        }
    }

});
