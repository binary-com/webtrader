/*
Created by Mahboob.M on 12.22.2015
*/
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var smmaOptionsMap = {}, smmaSeriesMap = {};
    function calculateSmmaValue(options) {

        //* Calculate SMMA FORMULA
        //PREVSUM = SMMA(i - 1) * N
        //SMMA(i) = (PREVSUM - SMMA(i - 1) + CLOSE(i)) / N
        //SUM1 — is the total sum of closing prices for N periods;
        //PREVSUM — is the smoothed sum of the previous bar;
        //SMMA1 — is the smoothed moving average of the first bar;
        //SMMA(i) — is the smoothed moving average of the current bar (except for the first one);
        //CLOSE(i) — is the current closing price;
        //N — is the smoothing period.
        if (options.index < options.period - 1) {
            return null;
        }
        else if (options.index === (options.period - 1)) {
            var sum = 0.0;
            for (var i = 0; i < options.period; i++) {
                sum += indicatorBase.getPrice(options.data.data, i, options.appliedTo, options.type);
            }
            return (sum / options.period);
        }
        else {
            var preSma = indicatorBase.getIndicatorData(options.data.smmaData, options.index - 1);
            var preSum = preSma * options.period;
            var smmaValue = (preSum - preSma + indicatorBase.getPrice(options.data.data, options.index, options.appliedTo, options.type)) / options.period;
            return smmaValue;
        }
    }

    //*************************INIT***************************************
    return {
        init: function () {
            (function (H, $, indicatorBase) {
                if (!H || H.Series.prototype.addSMMA) return;

                H.Series.prototype.addSMMA = function (smmaOptions) {
                    var seriesID = this.options.id;
                    smmaOptions = $.extend({
                        period: 20,
                        appliedTo: indicatorBase.CLOSE,
                        strokeColor: 'red',
                        strokeWidth: 1,
                        dashStyle: 'line',
                        parentSeriesID: seriesID
                    }, smmaOptions);

                    var uniqueID = '_' + new Date().getTime();

                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        var smmaData = [];
                        for (var index = 0; index < data.length; index++) {
                            var sOptions =
                                {
                                    data:
                                        {
                                            data: data,
                                            smmaData: smmaData
                                        },
                                    index: index,
                                    period: smmaOptions.period,
                                    type: this.options.type
                                    , appliedTo: smmaOptions.appliedTo
                                };
                            var smmaValue = calculateSmmaValue(sOptions);
                            smmaData.push([(data[index][0] || data[index].x), indicatorBase.toFixed(smmaValue, 4)]);
                        }

                        var chart = this.chart;

                        smmaOptionsMap[uniqueID] = smmaOptions;

                        //SMMA 
                        var series = this;
                        smmaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'SMMA (' + smmaOptions.period + ', ' + indicatorBase.appliedPriceString(smmaOptions.appliedTo) + ')',
                            data: smmaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: smmaOptions.strokeColor,
                            lineWidth: smmaOptions.strokeWidth,
                            dashStyle: smmaOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);


                        $(smmaSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'smma',
                            isIndicator: true,
                            parentSeriesID: smmaOptions.parentSeriesID
                        });

                        chart.redraw();
                    }
                };

                H.Series.prototype.removeSMMA = function (uniqueID) {
                    var chart = this.chart;
                    smmaOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    smmaSeriesMap[uniqueID] = null;
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckSMMA = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: smmaOptionsMap[uniqueID] != null
                    };
                };

                H.wrap(H.Series.prototype, 'addPoint', function (psmmaseed, options, redraw, shift, animation) {
                    psmmaseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(smmaOptionsMap, this.options.id)) {
                        updateSMMASeries.call(this, options[0]);
                    }
                });

                H.wrap(H.Point.prototype, 'update', function (psmmaseed, options, redraw, animation) {
                    psmmaseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(smmaOptionsMap, this.series.options.id)) {
                        console.log('SMMA : Updating SMMA values for main series ID : ', this.series.options.id);
                        updateSMMASeries.call(this.series, this.x, true);
                    }
                });


                function updateSMMASeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new data point
                    for (var key in smmaSeriesMap) {
                        if (smmaSeriesMap[key] && smmaSeriesMap[key].options && smmaSeriesMap[key].options.data && smmaSeriesMap[key].options.data.length > 0
                            && smmaOptionsMap[key].parentSeriesID === series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var smmaData = smmaSeriesMap[key].options.data;
                            var smmaOptions = smmaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var sOptions =
                               {
                                   data:
                                       {
                                           data: data,
                                           smmaData: smmaData
                                       },
                                   index: dataPointIndex,
                                   period: smmaOptions.period,
                                   type: this.options.type,
                                   appliedTo: smmaOptions.appliedTo
                               };
                                var smmaValue = calculateSmmaValue(sOptions);
                                if (isPointUpdate) {
                                    smmaSeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(smmaValue, 4) });
                                }
                                else {
                                    smmaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(smmaValue, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);
        }
    }
});
