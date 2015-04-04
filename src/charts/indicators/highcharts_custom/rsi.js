/**
 * Created by arnab on 3/22/15.
 */
define(['charts/indicators/highcharts_custom/indicator_base', 'highstock'], function (indicatorBase) {

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
                        var tr = [], rsiData = [];
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

                        this.rsiOptions = this.rsiOptions || {};
                        this.rsiOptions[uniqueID] = rsiOptions;

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
                            plotLines: rsiOptions.levels,
                            min: 0,
                            max: 100
                        }, false, false, false);

                        indicatorBase.recalculate(chart);

                        var series = this;
                        this.rsiSeries = this.rsiSeries || {};
                        this.rsiSeries[uniqueID] = chart.addSeries({
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

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeRSI = function (uniqueID) {
                    var chart = this.chart;
                    this.rsiOptions[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    chart.get('rsi' + uniqueID).remove(false);
                    this.rsiSeries[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    updateRSISeries.call(this, options);

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);

                    //if this is a point in RSI series, ignore
                    if (this.series.options.name.indexOf('RSI') != -1) return;

                    var series = this.series;

                    //Update RSI values
                    updateRSISeries.call(series, options, true);

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateRSISeries(options, isPointUpdate) {
                    //if this is RSI series, ignore
                    if (this.options.name.indexOf('RSI') == -1) {

                        var series = this;
                        var chart = series.chart;

                        //Add a new RSI data point
                        for (var key in this.rsiSeries) {
                            if (this.rsiSeries[key] && this.rsiSeries[key].options && this.rsiSeries[key].options.data && this.rsiSeries[key].options.data.length > 0) {
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
                                var matchFound = false;
                                var n = this.rsiOptions[key].period;
                                for (var index = 1; index < data.length; index++) {
                                    //Matching time
                                    if (data[index][0] === options[0] || data[index].x === options[0] || matchFound) {
                                        matchFound = true; //We have to recalculate all RSIs after a match has been found
                                        //Calculate RSI - start
                                        var rsiValue = 0.0;
                                        if (index >= n)
                                        {

                                            var avgGain = 0, avgLoss = 0;
                                            //Calculate RS - start
                                            for (var i = index, count = 1; i > 0 && count <= 14; i--, count++) {
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
                                        if (isNaN(rsiValue) || !isFinite(rsiValue) || rsiValue <= 0.0) continue;

                                        if (isPointUpdate)
                                        {
                                            this.rsiSeries[key].data[index].update([(data[index].x || data[index][0]), indicatorBase.toFixed(rsiValue , 2)]);
                                        }
                                        else
                                        {
                                            this.rsiSeries[key].addPoint([(data[index].x || data[index][0]), indicatorBase.toFixed(rsiValue , 2)], false, false);
                                            //Most of the time, we add one data point after the main series has been added. This will not be a
                                            //performance issue if that is the scenario. But if add many data points after RSI is added to the
                                            //main series, then we should rethink about this code
                                            this.rsiSeries[key].isDirty = true;
                                            this.rsiSeries[key].isDirtyData = true;
                                            chart.redraw();
                                        }
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
