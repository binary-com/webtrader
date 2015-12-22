/*
Created by Mahboob.M on 12.22.2015
*/
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var smmaOptionsMap = {}, smmaSeriesMap = {};
    var ma1Data = {}, ma2Data = {}, inputData = {};
    function calculateSmmaValue(data,smmaData, index, period, type, appliedTo) {

        //* Calculate SMMA FORMULA
        //PREVSUM = SMMA(i - 1) * N
        //SMMA(i) = (PREVSUM - SMMA(i - 1) + CLOSE(i)) / N
        //SUM1 — is the total sum of closing prices for N periods;
        //PREVSUM — is the smoothed sum of the previous bar;
        //SMMA1 — is the smoothed moving average of the first bar;
        //SMMA(i) — is the smoothed moving average of the current bar (except for the first one);
        //CLOSE(i) — is the current closing price;
        //N — is the smoothing period.
        if (index < period - 1) {
            return null;
        }
        else if (index === (period - 1)) {
            var sum = 0.0;
            for (var i = 0; i < period; i++) {
                sum += indicatorBase.getPrice(data, i, appliedTo, type);
            }
            return (sum / period);
        }
        else {
            var preSma = smmaData[index - 1][1] || smmaData[index - 1].y;
            var preSum = preSma * period;
            var smmaValue = (preSum - preSma + indicatorBase.getPrice(data, index, appliedTo, type)) / period;
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
                        ma1Data[uniqueID] = [], ma2Data[uniqueID] = [], inputData[uniqueID] = [];
                        for (var index = 0; index < data.length; index++) {
                            var smmaValue = calculateSmmaValue(data, smmaData, index, smmaOptions.period, this.options.type, smmaOptions.appliedTo);
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
                            var smmaData = smmaOptionsMap[key].options.data;
                            var smmaOptions = smmaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var smmaValue = calculateSmmaValue(data, smmaData, dataPointIndex, smmaOptions.period, this.options.type, smmaOptions.appliedTo);
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
