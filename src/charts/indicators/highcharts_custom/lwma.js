/*
Created by Mahboob.M on 12.22.2015
*/
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var lwmaOptionsMap = {}, lwmaSeriesMap = {};
    function calculateLwmaValue(options) {

        //* Calculate LWMA FORMULA
        // LWMA = SUM(Close(i)*i, N)/SUM(i, N)
        //Where: 
        // SUM(i, N) — is the total sum of weight coefficients.
        if (options.index < options.period - 1) {
            return null;
        }
        else {
            var sum = 0.0;
            var sumI = 0;
            for (var i = 0; i < options.period; i++) {
                sum += indicatorBase.getPrice(options.data, options.index - i, options.appliedTo, options.type) * (options.index - i);
                sumI += options.index - i;
            }
            return (sum / sumI);
        }
    }

    //*************************INIT***************************************
    return {
        init: function () {
            (function (H, $, indicatorBase) {
                if (!H || H.Series.prototype.addLWMA) return;

                H.Series.prototype.addLWMA = function (lwmaOptions) {
                    var seriesID = this.options.id;
                    lwmaOptions = $.extend({
                        period: 20,
                        appliedTo: indicatorBase.CLOSE,
                        strokeColor: 'red',
                        strokeWidth: 1,
                        dashStyle: 'line',
                        parentSeriesID: seriesID
                    }, lwmaOptions);

                    var uniqueID = '_' + new Date().getTime();

                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        var lwmaData = [];
                        for (var index = 0; index < data.length; index++) {
                            var lOptions =
                               {
                                   data: data,
                                   index: index,
                                   period: lwmaOptions.period,
                                   type: this.options.type,
                                   appliedTo: lwmaOptions.appliedTo
                               };
                            var lwmaValue = calculateLwmaValue(lOptions);
                            lwmaData.push([(data[index][0] || data[index].x), indicatorBase.toFixed(lwmaValue, 4)]);
                        }

                        var chart = this.chart;

                        lwmaOptionsMap[uniqueID] = lwmaOptions;

                        //LWMA 
                        var series = this;
                        lwmaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'LWMA (' + lwmaOptions.period + ', ' + indicatorBase.appliedPriceString(lwmaOptions.appliedTo) + ')',
                            data: lwmaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: lwmaOptions.strokeColor,
                            lineWidth: lwmaOptions.strokeWidth,
                            dashStyle: lwmaOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);


                        $(lwmaSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'lwma',
                            isIndicator: true,
                            parentSeriesID: lwmaOptions.parentSeriesID
                        });

                        chart.redraw();
                    }
                };

                H.Series.prototype.removeLWMA = function (uniqueID) {
                    var chart = this.chart;
                    lwmaOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    lwmaSeriesMap[uniqueID] = null;
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckLWMA = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: lwmaOptionsMap[uniqueID] != null
                    };
                };

                H.wrap(H.Series.prototype, 'addPoint', function (plwmaseed, options, redraw, shift, animation) {
                    plwmaseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(lwmaOptionsMap, this.options.id)) {
                        updateLWMASeries.call(this, options[0]);
                    }
                });

                H.wrap(H.Point.prototype, 'update', function (plwmaseed, options, redraw, animation) {
                    plwmaseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(lwmaOptionsMap, this.series.options.id)) {
                        console.log('LWMA : Updating LWMA values for main series ID : ', this.series.options.id);
                        updateLWMASeries.call(this.series, this.x, true);
                    }
                });


                function updateLWMASeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new data point
                    for (var key in lwmaSeriesMap) {
                        if (lwmaSeriesMap[key] && lwmaSeriesMap[key].options && lwmaSeriesMap[key].options.data && lwmaSeriesMap[key].options.data.length > 0
                            && lwmaOptionsMap[key].parentSeriesID === series.options.id
                            && lwmaSeriesMap[key].chart === chart
                        ) {
                            //Find the data point
                            var data = series.options.data;
                            var lwmaOptions = lwmaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var lOptions =
                                {
                                    data: data,
                                    index: dataPointIndex,
                                    period: lwmaOptions.period,
                                    type: this.options.type,
                                    appliedTo: lwmaOptions.appliedTo
                                };
                                var lwmaValue = calculateLwmaValue(lOptions);
                                if (isPointUpdate) {
                                    lwmaSeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(lwmaValue, 4) });
                                }
                                else {
                                    lwmaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(lwmaValue, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);
        }
    }
});
