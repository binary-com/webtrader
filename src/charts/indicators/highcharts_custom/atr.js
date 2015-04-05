/**
 * Created by arnab on 3/22/15.
 */
define(['charts/indicators/highcharts_custom/indicator_base', 'highstock'], function (indicatorBase) {

    var atrOptionsMap = {}, atrSeriesMap = {};

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

                        atrOptionsMap[uniqueID] = atrOptions;

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
                        atrSeriesMap[uniqueID] = chart.addSeries({
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

                        $(atrSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'atr',
                            parentSeriesID: atrOptions.parentSeriesID,
                            period: atrOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();
                        //console.log('series.options.length : ', this.options.data.length);
                        //console.log('atrSeriesMap.options.data.length : ', atrSeriesMap[uniqueID].options.data.length);

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeATR = function (uniqueID) {
                    var chart = this.chart;
                    atrOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    chart.get('atr' + uniqueID).remove(false);
                    atrSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(atrOptionsMap, this.options.id))
                    {
                        updateATRSeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(atrOptionsMap, this.series.options.id))
                    {
                        updateATRSeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateATRSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new ATR data point
                    for (var key in atrSeriesMap) {
                        if (atrSeriesMap[key] && atrSeriesMap[key].options && atrSeriesMap[key].options.data
                                            && atrSeriesMap[key].options.data.length > 0
                                            && atrOptionsMap[key].parentSeriesID == series.options.id) {
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
                            var atrData = atrSeriesMap[key].options.data;
                            var matchFound = false;
                            var n = atrOptionsMap[key].period;
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
                                        //console.log('series.options.data.length , update : ', data.length, ', Series name : ', series.options.name);
                                        //console.log('atrSeries.options.data.length , update : ', atrSeriesMap[key].options.data.length);
                                        if (atrSeriesMap[key].options.data.length < data.length) {
                                            atrSeriesMap[key].addPoint([(data[index].x || data[index][0]), atr]);
                                        } else
                                        {
                                            atrSeriesMap[key].data[index].update([(data[index].x || data[index][0]), atr]);
                                        }
                                    }
                                    else
                                    {
                                        //console.log('series.options.data.length : ', data.length);
                                        //console.log('atrSeries.options.data.length (before) : ', atrSeriesMap[key].options.data.length);
                                        atrSeriesMap[key].addPoint([(data[index].x || data[index][0]), atr]);
                                        //console.log('atrSeries.options.data.length (after) : ', atrSeriesMap[key].options.data.length);
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
