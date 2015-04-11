/**
 * Created by arnab on 3/22/15.
 */
define(['charts/indicators/highcharts_custom/indicator_base', 'highstock'], function (indicatorBase) {

    var smaOptionsMap = {}, smaSeriesMap = {};
    
    return {
        init: function() {

            (function(H,$,indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addSMA) return;

                H.Series.prototype.addSMA = function ( smaOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    smaOptions = $.extend({
                        period : 21,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID : seriesID
                    }, smaOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ATR series to the chart
                    var data = this.options.data || [];
                    //If period is higher than data.length, we cannot calculate SMA. Return from here
                    if (smaOptions.period >= data.length) return;

                    if (data && data.length > 0)
                    {

                        //Calculate SMA data
                        /*

                            Daily Closing Prices: 11,12,13,14,15,16,17
                            First day of 5-day SMA: (11 + 12 + 13 + 14 + 15) / 5 = 13
                            Second day of 5-day SMA: (12 + 13 + 14 + 15 + 16) / 5 = 14
                            Third day of 5-day SMA: (13 + 14 + 15 + 16 + 17) / 5 = 15

                         *  Formula(OHLC or Candlestick), consider the indicated price(O,H,L,C) -
                         *  Formula(other chart types) -
                         * 	    sma(t) = (sma(t-1) x (n - 1) + price) / n
                         * 		    t - current
                         * 		    n - period
                         *
                         *  Do not fill any value in smaData from 0 index to options.period-1 index

                         */
                        var tr = [], smaData = [], sum = 0.0;
                        for (var index = 0; index < smaOptions.period; index++)
                        {
                            if (indicatorBase.isOHLCorCandlestick(this.options.type))
                            {
                                sum += indicatorBase.extractPriceForAppliedTO(smaOptions.appliedTo, data, index);
                            }
                            else
                            {
                                sum += indicatorBase.extractPrice(data, index);
                            }
                            if (index == (smaOptions.period - 1))
                            {
                                smaData.push([data[smaOptions.period - 1].x ? data[smaOptions.period - 1].x : data[smaOptions.period - 1][0], sum / smaOptions.period]);
                            }
                            else
                            {
                                smaData.push([data[smaOptions.period - 1].x ? data[smaOptions.period - 1].x : data[smaOptions.period - 1][0], null]);
                            }
                        }

                        for (var index = smaOptions.period; index < data.length; index++)
                        {

                            var price = 0.0;
                            if (indicatorBase.isOHLCorCandlestick(this.options.type))
                            {
                                price = indicatorBase.extractPriceForAppliedTO(smaOptions.appliedTo, data, index);
                            }
                            else
                            {
                                price = data[index].y ? data[index].y : data[index][1];
                            }

                            //Calculate SMA - start
                            var smaValue = (smaData[index - 1][1] * (smaOptions.period - 1) + price) / smaOptions.period;
                            smaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(smaValue , 4)]);
                            //Calculate SMA - end

                        }

                        var chart = this.chart;

                        smaOptionsMap[uniqueID] = smaOptions;

                        var series = this;
                        smaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'SMA(' + smaOptions.period  + ', ' + indicatorBase.appliedPriceString(smaOptions.appliedTo) + ')',
                            data: smaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            //yAxis: 'sma'+ uniqueID,
                            opposite: series.options.opposite,
                            color: smaOptions.stroke,
                            lineWidth: smaOptions.strokeWidth,
                            dashStyle: smaOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(smaSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'sma',
                            isIndicator: true,
                            parentSeriesID: smaOptions.parentSeriesID,
                            period: smaOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeSMA = function (uniqueID) {
                    var chart = this.chart;
                    smaOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    smaSeriesMap[uniqueID] = null;
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(smaOptionsMap, this.options.id)) {
                        updateSMASeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(smaOptionsMap, this.series.options.id)) {
                        updateSMASeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 */
                function updateSMASeries(options, isPointUpdate) {
                    //if this is SMA series, ignore
                    var series = this;
                    var chart = series.chart;

                    //Add a new SMA data point
                    for (var key in smaSeriesMap) {
                        if (smaSeriesMap[key] && smaSeriesMap[key].options && smaSeriesMap[key].options.data && smaSeriesMap[key].options.data.length > 0) {
                            //This is SMA series. Add one more SMA point
                            //Calculate SMA data
                            /*
                             * Formula(OHLC or Candlestick), consider the indicated price(O,H,L,C) -
                             * Formula(other chart types) -
                             * 	sma(t) = (sma(t-1) x (n - 1) + price) / n
                             * 		t - current
                             * 		n - period
                             *
                             */
                            //Find the data point
                            var data = series.options.data;
                            var smaData = smaSeriesMap[key].options.data;
                            var n = smaOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                var price = 0.0;
                                if (indicatorBase.isOHLCorCandlestick(this.options.type))
                                {
                                    price = indicatorBase.extractPriceForAppliedTO(smaOptionsMap[key].appliedTo, data, dataPointIndex);
                                }
                                else
                                {
                                    price = data[dataPointIndex].y ? data[dataPointIndex].y : data[dataPointIndex][1];
                                }

                                //Calculate SMA - start
                                var smaValue = indicatorBase.toFixed(((smaData[dataPointIndex - 1].y || smaData[dataPointIndex - 1][1]) * (n - 1) + price) / n, 4);
                                if (isPointUpdate)
                                {
                                    if (smaSeriesMap[key].options.data.length < data.length) {
                                        smaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), smaValue]);
                                    } else {
                                        smaSeriesMap[key].data[dataPointIndex].update([(data[dataPointIndex].x || data[dataPointIndex][0]), smaValue]);
                                    }
                                }
                                else
                                {
                                    smaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), smaValue]);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    }

});
