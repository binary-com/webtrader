/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var rsiOptionsMap = {}, rsiSeriesMap = {};
    
    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addRSI) return;

                H.Series.prototype.addRSI = function ( rsiOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    rsiOptions = $.extend({
                        period : 14,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        parentSeriesID : seriesID
                    }, rsiOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add RSI series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate RSI data
                        /*
                         * Formula -
                         * 	rs(t) = avg-gain(n) / avg-loss(n)
                         *  rsi(t) = if avg-loss(n) == 0 ? 100 : 100 - (100/ (1+rs(t))
                         * 		t - current
                         * 		n - period
                         */
                        var rsiData = [];
                        for (var index = 0; index < data.length; index++)
                        {

                            //Calculate RSI - start
                            if (index >= rsiOptions.period)
                            {

                                var avgGain = 0, avgLoss = 0;
                                //Calculate RS - start
                                for (var i = index, count = 1; i > 0 && count <= 14; i--, count++) {
                                    var price1 = indicatorBase.extractPrice(data, i-1);
                                    var price2 = indicatorBase.extractPrice(data, i);
                                    if (price2 > price1) avgGain += price2 - price1;
                                    if (price2 < price1) avgLoss += price1 - price2;
                                }
                                avgGain /= rsiOptions.period;
                                avgLoss /= rsiOptions.period;
                                var rs = avgGain / avgLoss;
                                //Calculate RS - end

                                var rsiValue = (avgLoss == 0 ? 100 : (100 - (100 / (1+rs))));
                                if (isFinite(rsiValue) && !isNaN(rsiValue))
                                {
                                    rsiData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(rsiValue , 2)]);
                                }
                            }
                            else
                            {
                                rsiData.push([(data[index].x || data[index][0]), 0]);
                            }
                            //Calculate RSI - end

                        }

                        var chart = this.chart;

                        rsiOptionsMap[uniqueID] = rsiOptions;

                        chart.addAxis({ // Secondary yAxis
                            id: 'rsi'+ uniqueID,
                            title: {
                                text: 'RSI(' + rsiOptions.period  + ')',
                                align: 'high',
                                offset: 0,
                                rotation: 0,
                                y: 10, //Trying to show title inside the indicator chart
                                x: 50
                            },
                            lineWidth: 2,
                            plotLines: rsiOptions.levels
                        }, false, false, false);

                        indicatorBase.recalculate(chart);

                        var series = this;
                        rsiSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'RSI(' + rsiOptions.period  + ')',
                            data: rsiData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            yAxis: 'rsi'+ uniqueID,
                            opposite: series.options.opposite,
                            color: rsiOptions.stroke,
                            lineWidth: rsiOptions.strokeWidth,
                            dashStyle: rsiOptions.dashStyle
                        }, false, false);

                        $(rsiSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'rsi',
                            parentSeriesID: rsiOptions.parentSeriesID,
                            period: rsiOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeRSI = function (uniqueID) {
                    var chart = this.chart;
                    rsiOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    chart.get('rsi' + uniqueID).remove(false);
                    rsiSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(rsiOptionsMap, this.options.id)) {
                        updateRSISeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(rsiOptionsMap, this.series.options.id)) {
                        updateRSISeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateRSISeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new RSI data point
                    for (var key in rsiSeriesMap) {
                        if (rsiSeriesMap[key] && rsiSeriesMap[key].options && rsiSeriesMap[key].options.data && rsiSeriesMap[key].options.data.length > 0
                            && rsiOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is RSI series. Add one more RSI point
                            //Calculate RSI data
                            /*
                             * Formula(OHLC or Candlestick) -
                             * 	rs(t) = avg-gain(n) / avg-loss(n)
                             *  rsi(t) = if avg-loss(n) == 0 ? 100 : 100 - (100/ (1+rs(t))
                             * 		t - current
                             * 		n - period
                             */
                            //Find the data point
                            var data = series.options.data;
                            var n = rsiOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate RSI - start
                                var rsiValue = 0.0;
                                if (dataPointIndex >= n)
                                {

                                    var avgGain = 0, avgLoss = 0;
                                    //Calculate RS - start
                                    for (var i = dataPointIndex, count = 1; i > 0 && count <= n; i--, count++) {
                                        var price1 = indicatorBase.extractPrice(data, i-1);
                                        var price2 = indicatorBase.extractPrice(data, i);
                                        if (price2 > price1) avgGain += price2 - price1;
                                        if (price2 < price1) avgLoss += price1 - price2;
                                    }
                                    avgGain /= n;
                                    avgLoss /= n;
                                    var rs = avgGain / avgLoss;
                                    //Calculate RS - end

                                    rsiValue = (avgLoss == 0 ? 100 : (100 - (100 / (1+rs))));

                                }
                                //Calculate RSI - end
                                rsiValue = indicatorBase.toFixed(rsiValue , 2);

                                if (isPointUpdate)
                                {
                                    if (rsiSeriesMap[key].options.data.length < data.length) {
                                        rsiSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), rsiValue]);
                                    } else {
                                        rsiSeriesMap[key].data[dataPointIndex].update([(data[dataPointIndex].x || data[dataPointIndex][0]), rsiValue]);
                                    }
                                }
                                else
                                {
                                    rsiSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), rsiValue]);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery,indicatorBase);

        }
    }

});
