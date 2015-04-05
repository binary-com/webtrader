/**
 * Created by arnab on 3/22/15.
 */
define(['charts/indicators/highcharts_custom/indicator_base', 'highstock'], function (indicatorBase) {

    var emaOptionsMap = {}, emaSeriesMap = {};
    
    return {
        init: function () {

            (function (H, $) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addEMA) return;

                H.Series.prototype.addEMA = function (emaOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    emaOptions = $.extend({
                        period: 21,
                        stroke: 'red',
                        strokeWidth: 2,
                        dashStyle: 'line',
                        levels: [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID: seriesID
                    }, emaOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ATR series to the chart
                    var data = this.options.data || [];
                    //If period is higher than data.length, we cannot calculate EMA. Return from here
                    if (emaOptions.period >= data.length) return;

                    if (data && data.length > 0) {

                        //Calculate EMA data
                        /*  ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
                         *  Do not fill any value in emaData from 0 index to options.period-1 index
                         */
                        var tr = [], emaData = [], sum = 0.0;
                        for (var index = 0; index < emaOptions.period; index++) {
                            if (indicatorBase.isOHLCorCandlestick(this.options.type)) {
                                sum += indicatorBase.extractPriceForAppliedTO(emaOptions.appliedTo, data, index);
                            }
                            else {
                                sum += data[index].y ? data[index].y : data[index][1];
                            }
                            if (index == (emaOptions.period - 1)) {
                                emaData.push([data[emaOptions.period - 1].x ? data[emaOptions.period - 1].x : data[emaOptions.period - 1][0], sum / emaOptions.period]);
                            }
                            else {
                                emaData.push([data[emaOptions.period - 1].x ? data[emaOptions.period - 1].x : data[emaOptions.period - 1][0], null]);
                            }
                        }

                        for (var index = emaOptions.period; index < data.length; index++) {

                            var price = 0.0;
                            if (indicatorBase.isOHLCorCandlestick(this.options.type)) {
                                price = indicatorBase.extractPriceForAppliedTO(emaOptions.appliedTo, data, index);
                            }
                            else {
                                price = data[index].y ? data[index].y : data[index][1];
                            }

                            //Calculate EMA - start
                            //ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
                            var emaValue = (price * 2 / (emaOptions.period + 1)) + ((emaData[index - 1][1] || emaData[index - 1].y) * (1 - 2 / (emaOptions.period + 1)))
                            emaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(emaValue, 4)]);
                            //Calculate EMA - end

                        }

                        var chart = this.chart;

                        emaOptionsMap[uniqueID] = emaOptions;

                        var series = this;
                        emaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'EMA(' + emaOptions.period + ', ' + indicatorBase.appliedPriceString(emaOptions.period) + ')',
                            data: emaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            //yAxis: 'ema'+ uniqueID,
                            opposite: series.options.opposite,
                            color: emaOptions.stroke,
                            lineWidth: emaOptions.strokeWidth,
                            dashStyle: emaOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(emaSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'ema',
                            isIndicator: true,
                            parentSeriesID: emaOptions.parentSeriesID,
                            period: emaOptions.period
                        });
                        //console.log('EMA series data length : ', emaSeriesMap[uniqueID].options.data.length, ', Instrument series data length : ', this.options.data.length);

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeEMA = function (uniqueID) {
                    var chart = this.chart;
                    emaOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    emaSeriesMap[uniqueID] = null;
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(emaOptionsMap, this.options.id)) {
                        updateEMASeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(emaOptionsMap, this.series.options.id)) {
                        updateEMASeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 */
                function updateEMASeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new EMA data point
                    for (var key in emaSeriesMap) {
                        if (emaSeriesMap[key] && emaSeriesMap[key].options && emaSeriesMap[key].options.data && emaSeriesMap[key].options.data.length > 0) {
                            //This is EMA series. Add one more EMA point
                            //Calculate EMA data
                            /*
                             * ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
                             */
                            //Find the data point
                            var data = series.options.data;
                            var emaData = emaSeriesMap[key].options.data;
                            var matchFound = false;
                            var n = emaOptionsMap[key].period;
                            for (var index = 1; index < data.length; index++) {
                                //Matching time
                                if (data[index][0] === options[0] || data[index].x === options[0] || matchFound) {
                                    matchFound = true; //We have to recalculate all EMAs after a match has been found
                                    var price = 0.0;
                                    if (indicatorBase.isOHLCorCandlestick(this.options.type)) {
                                        price = indicatorBase.extractPriceForAppliedTO(emaOptionsMap[key].appliedTo, data, index);
                                    }
                                    else {
                                        price = data[index].y ? data[index].y : data[index][1];
                                    }

                                    //Calculate EMA - start
                                    var emaValue = indicatorBase.toFixed((price * 2 / (n + 1)) + ((emaData[index - 1][1] || emaData[index - 1].y) * (1 - 2 / (n + 1))), 4);
                                    //console.log(emaValue, price, n, emaData[index - 1]);
                                     //emaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(emaValue , 4)]);
                                    if (isPointUpdate) {
                                        if (emaSeriesMap[key].options.data.length < data.length) {
                                            emaSeriesMap[key].addPoint([(data[index].x || data[index][0]), emaValue]);
                                        } else
                                        {
                                            emaSeriesMap[key].data[index].update([(data[index].x || data[index][0]), emaValue]);
                                        }
                                    }
                                    else {
                                        emaSeriesMap[key].addPoint([(data[index].x || data[index][0]), emaValue]);
                                    }
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    };
});
