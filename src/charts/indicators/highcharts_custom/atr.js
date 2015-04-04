/**
 * Created by arnab on 3/22/15.
 */
define(['charts/indicators/highcharts_custom/indicator_base', 'highstock'], function (indicatorBase) {

    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addATR) return;

                H.Series.prototype.addATR = function ( atrOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    atrOptions = $.extend({
                        period : 14,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        parentSeriesID : seriesID
                    }, atrOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ATR series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {

                        //Calculate ATR data
                        /*
                         * Formula(OHLC or Candlestick) -
                         * 	tr(t) = max[(high - low), abs(high - close(t - 1)), abs(low - close(t - 1))]
                         * 	atr(t) = (atr(t-1) x (n - 1) + tr(t)) / n
                         * 		t - current
                         * 		n - period
                         *
                         * Formula(other chart types) -
                         * 	tr(t) = abs(close(t) - close(t - 1))
                         * 	atr(t) = (atr(t-1) x (n - 1) + tr(t)) / n
                         * 		t - current
                         * 		n - period
                         */
                        var tr = [], atrData = [];
                        for (var index = 0; index < data.length; index++)
                        {

                            //Calculate TR - start
                            if (indicatorBase.isOHLCorCandlestick(this.options.type))
                            {
                                if (index == 0)
                                {
                                    tr.push((data[index].high || data[index][2]) - (data[index].low || [index][3]));
                                }
                                else
                                {
                                    tr.push(
                                        Math.max(Math.max((data[index].high || data[index][2]) - (data[index].low || data[index][3]), Math.abs((data[index].high || data[index][2]) - (data[index - 1].close || data[index - 1][4])))
                                            , (data[index].low || data[index][3]) - (data[index - 1].close || data[index - 1][4])
                                        )
                                    );
                                }
                            }
                            else
                            {
                                if (index == 0)
                                {
                                    //The close price is TR when index is 0
                                    tr.push(data[index].y || data[index][1]);
                                }
                                else
                                {
                                    tr.push(Math.abs((data[index].y || data[index][1]) - (data[index - 1].y || data[index - 1][1])));
                                }
                            }
                            //Calculate TR - end

                            //Calculate ATR - start
                            if (index >= atrOptions.period)
                            {
                                var atrValue = (atrData[index - 1][1] * (atrOptions.period - 1) + tr[index]) / atrOptions.period;
                                if (isFinite(atrValue) && !isNaN(atrValue))
                                {
                                    atrData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(atrValue, 2)]);
                                }
                            }
                            else
                            {
                                atrData.push([(data[index].x || data[index][0]), 0]);
                            }
                            //Calculate ATR - end

                        }

                        var chart = this.chart;

                        this.atrOptions = this.atrOptions || {};
                        this.atrOptions[uniqueID] = atrOptions;

                        chart.addAxis({ // Secondary yAxis
                            id: 'atr'+ uniqueID,
                            title: {
                                text: 'ATR(' + atrOptions.period  + ')',
                                align: 'high',
                                offset: 0,
                                rotation: 0,
                                y: 10, //Trying to show title inside the indicator chart
                                x: 50
                            },
                            lineWidth: 2
                        }, false, false, false);

                        indicatorBase.recalculate(chart);

                        var series = this;
                        this.atrSeries = this.atrSeries || {};
                        this.atrSeries[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'ATR(' + atrOptions.period  + ')',
                            data: atrData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            yAxis: 'atr'+ uniqueID,
                            opposite: series.options.opposite,
                            color: atrOptions.stroke,
                            lineWidth: atrOptions.strokeWidth,
                            dashStyle: atrOptions.dashStyle
                        }, false, false);

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeATR = function (uniqueID) {
                    var chart = this.chart;
                    this.atrOptions[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    chart.get('atr' + uniqueID).remove(false);
                    this.atrSeries[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    updateATRSeries.call(this, options);

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);

                    //if this is a point in ATR series, ignore
                    if (this.series.options.name.indexOf('ATR') != -1) return;

                    var series = this.series;

                    //Update ATR values
                    updateATRSeries.call(series, options, true);

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateATRSeries(options, isPointUpdate) {
                    //if this is ATR series, ignore
                    if (this.options.name.indexOf('ATR') == -1) {

                        var series = this;
                        var chart = series.chart;

                        //Add a new ATR data point
                        for (var key in this.atrSeries) {
                            if (this.atrSeries[key] && this.atrSeries[key].options && this.atrSeries[key].options.data && this.atrSeries[key].options.data.length > 0) {
                                //This is ATR series. Add one more ATR point
                                //Calculate ATR data
                                /*
                                 * Formula(OHLC or Candlestick) -
                                 * 	tr(t) = max[(high - low), abs(high - close(t - 1)), abs(low - close(t - 1))]
                                 * 	atr(t) = (atr(t-1) x (n - 1) + tr(t)) / n
                                 * 		t - current
                                 * 		n - period
                                 *
                                 * Formula(other chart types) -
                                 * 	tr(t) = abs(close(t) - close(t - 1))
                                 * 	atr(t) = (atr(t-1) x (n - 1) + tr(t)) / n
                                 * 		t - current
                                 * 		n - period
                                 */
                                //Find the data point
                                var data = series.options.data;
                                var atrData = this.atrSeries[key].options.data;
                                var matchFound = false;
                                var n = this.atrOptions[key].period;
                                for (var index = 1; index < data.length; index++) {
                                    //Matching time
                                    if (data[index][0] === options[0] || data[index].x === options[0] || matchFound) {
                                        matchFound = true; //We have to recalculate all ATRs after a match has been found
                                        var tr = 0.0;
                                        if (indicatorBase.isOHLCorCandlestick(series.options.type)) {
                                            tr = Math.max(Math.max((data[index].high || data[index][2]) - (data[index].low || data[index][3]), Math.abs((data[index].high || data[index][2]) - (data[index - 1].close || data[index - 1][4])))
                                                , (data[index].low || data[index][3]) - (data[index - 1].close || data[index - 1][4])
                                            );
                                        }
                                        else {
                                            tr = Math.abs((data[index].y || data[index][1]) - (data[index - 1].y || data[index - 1][1]));
                                        }
                                        //Round to 2 decimal places
                                        var atr = indicatorBase.toFixed(( (atrData[index - 1].y || atrData[index - 1][1]) * (n - 1) + tr ) / n, 2) ;
                                        if (isPointUpdate)
                                        {
                                            this.atrSeries[key].data[index].update([(data[index].x || data[index][0]), atr]);
                                        }
                                        else
                                        {
                                            this.atrSeries[key].addPoint([(data[index].x || data[index][0]), atr], false, false);
                                            //Most of the time, we add one data point after the main series has been added. This will not be a
                                            //performance issue if that is the scenario. But if add many data points after ATR is added to the
                                            //main series, then we should rethink about this code
                                            this.atrSeries[key].isDirty = true;
                                            this.atrSeries[key].isDirtyData = true;
                                            chart.redraw();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

            } (Highcharts,jQuery,indicatorBase));

        }
    }

});
