/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var typpriceOptionsMap = {}, typpriceSeriesMap = {};

    function calculateIndicatorValue(indicatorBase, data, index) {
        var price = 0.0;

        if (indicatorBase.isOHLCorCandlestick(this.options.type)) {
            price = ((data[index][2] || data[index].high) + (data[index][3] || data[index].low) + (data[index][4] || data[index].close)) / 3;
        }
        else {
            //typical price is same as the price chart because its not OHLC
            price = data[index].y ? data[index].y : data[index][1];
        }
        return price;
    }

    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addTYPPRICE) return;

                H.Series.prototype.addTYPPRICE = function ( typpriceOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    typpriceOptions = $.extend({
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        parentSeriesID : seriesID
                    }, typpriceOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ATR series to the chart
                    var data = this.options.data || [];

                    if (data && data.length > 0)
                    {

                        //Calculate TYPPRICE data
                        /*
                         *  Formula -
                         * 	    typprice = (high + low + close) / 3
                         *
                         */
                        var typpriceData = [];
                        for (var index = 0; index < data.length; index++)
                        {

                            var price = calculateIndicatorValue.call(this, indicatorBase, data, index);
                            //Calculate TYPPRICE - start
                            typpriceData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(price , 4)]);
                            //Calculate TYPPRICE - end

                        }

                        var chart = this.chart;

                        typpriceOptionsMap[uniqueID] = typpriceOptions;

                        var series = this;
                        typpriceSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'TYPPRICE',
                            data: typpriceData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            //yAxis: 'typprice'+ uniqueID,
                            opposite: series.options.opposite,
                            color: typpriceOptions.stroke,
                            lineWidth: typpriceOptions.strokeWidth,
                            dashStyle: typpriceOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(typpriceSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'typprice',
                            isIndicator: true,
                            parentSeriesID: typpriceOptions.parentSeriesID
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeTYPPRICE = function (uniqueID) {
                    var chart = this.chart;
                    typpriceOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    typpriceSeriesMap[uniqueID] = null;
                };

                H.Series.prototype.preRemovalCheckTYPPRICE = function(uniqueID) {
                    return {
                        isMainIndicator : true,
                        isValidUniqueID : typpriceOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(typpriceOptionsMap, this.options.id)) {
                        updateTYPPRICESeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(typpriceOptionsMap, this.series.options.id)) {
                        updateTYPPRICESeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 */
                function updateTYPPRICESeries(time, isPointUpdate) {
                    //if this is TYPPRICE series, ignore
                    var series = this;
                    var chart = series.chart;

                    //Add a new TYPPRICE data point
                    for (var key in typpriceSeriesMap) {
                        if (typpriceSeriesMap[key] && typpriceSeriesMap[key].options && typpriceSeriesMap[key].options.data && typpriceSeriesMap[key].options.data.length > 0
                            && typpriceOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is TYPPRICE series. Add one more TYPPRICE point
                            //Calculate TYPPRICE data
                            /*
                             * Formula(OHLC or Candlestick), consider the indicated price(O,H,L,C) -
                             * Formula(other chart types) -
                             * 	typprice(t) = (typprice(t-1) x (n - 1) + price) / n
                             * 		t - current
                             * 		n - period
                             *
                             */
                            //Find the data point
                            var data = series.options.data;
                            var typpriceData = typpriceSeriesMap[key].options.data;
                            var n = typpriceOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var price = calculateIndicatorValue.call(this, indicatorBase, data, dataPointIndex);
                                //console.log('typrice : ' + price);

                                //Calculate TYPPRICE - start
                                var typpriceValue = indicatorBase.toFixed(price, 4);
                                if (isPointUpdate)
                                {
                                    typpriceSeriesMap[key].data[dataPointIndex].update({ y : typpriceValue});
                                }
                                else
                                {
                                    typpriceSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), typpriceValue], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    }

});
