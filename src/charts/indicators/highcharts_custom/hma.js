/*
Created by Mahboob.M on 12.22.2015
*/
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var hmaOptionsMap = {}, hmaSeriesMap = {};
    var ma1Data = {}, ma2Data = {}, inputData = {};
    function calculateHmaValue(data, hmaData, index, period, maType, type, key, isPointUpdate, appliedTo) {

        //* Calculate HMA FORMULA
        // HMA(n) = WMA(2*WMA(n/2) – WMA(n)),sqrt(n))
        var time = (data[index][0] || data[index].x);

        var n = Math.round(period / 2);
        var ma1Value = indicatorBase.calculateMAValue(data, ma1Data[key], index, n, maType, type, 'n' + key, isPointUpdate, appliedTo);
        if (isPointUpdate) {
            ma1Data[key][index] = [time, ma1Value];
        }
        else {
            ma1Data[key].push([time, ma1Value]);
        }

        var ma2Value = indicatorBase.calculateMAValue(data, ma2Data[key], index, period, maType, type, 'p' + key, isPointUpdate, appliedTo);
        if (isPointUpdate) {
            ma2Data[key][index] = [time, ma2Value];
        }
        else {
            ma2Data[key].push([time, ma2Value]);
        }

        var ma3Value = 2 * ma1Value - ma2Value;

        if (isPointUpdate) {
            inputData[key][index] = [time, ma3Value];
        }
        else {
            inputData[key].push([time, ma3Value]);
        }

        var hmaPeriod = Math.round(Math.sqrt(period, 2));
        var hmaValue = indicatorBase.calculateMAValue(inputData[key], hmaData, index, hmaPeriod, maType, type, 'h' + key, isPointUpdate, appliedTo);

        return hmaValue;
    }

    //*************************INIT***************************************
    return {
        init: function () {
            (function (H, $, indicatorBase) {
                if (!H || H.Series.prototype.addHMA) return;

                H.Series.prototype.addHMA = function (hmaOptions) {
                    var seriesID = this.options.id;
                    hmaOptions = $.extend({
                        period: 20,
                        maType: "SMA",
                        appliedTo: indicatorBase.CLOSE,
                        strokeColor: 'red',
                        strokeWidth: 1,
                        dashStyle: 'line',
                        parentSeriesID: seriesID
                    }, hmaOptions);

                    var uniqueID = '_' + new Date().getTime();

                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        var hmaData = [];
                        ma1Data[uniqueID] = [], ma2Data[uniqueID] = [], inputData[uniqueID] = [];
                        for (var index = 0; index < data.length; index++) {
                            var hmaValue = calculateHmaValue(data, hmaData, index, hmaOptions.period, hmaOptions.maType, this.options.type,uniqueID, false, hmaOptions.appliedTo);
                            hmaData.push([(data[index][0] || data[index].x), indicatorBase.toFixed(hmaValue, 4)]);
                        }

                        var chart = this.chart;

                        hmaOptionsMap[uniqueID] = hmaOptions;

                        //HMA 
                        var series = this;
                        hmaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'HMA (' + hmaOptions.period + ', ' + indicatorBase.appliedPriceString(hmaOptions.appliedTo) + ')',
                            data: hmaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: hmaOptions.strokeColor,
                            lineWidth: hmaOptions.strokeWidth,
                            dashStyle: hmaOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);


                        $(hmaSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'hma',
                            isIndicator: true,
                            parentSeriesID: hmaOptions.parentSeriesID
                        });

                        chart.redraw();
                    }
                };

                H.Series.prototype.removeHMA = function (uniqueID) {
                    var chart = this.chart;
                    hmaOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    hmaSeriesMap[uniqueID] = null;
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckHMA = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: hmaOptionsMap[uniqueID] != null
                    };
                };

                H.wrap(H.Series.prototype, 'addPoint', function (phmaseed, options, redraw, shift, animation) {
                    phmaseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(hmaOptionsMap, this.options.id)) {
                        updateHMASeries.call(this, options[0]);
                    }
                });

                H.wrap(H.Point.prototype, 'update', function (phmaseed, options, redraw, animation) {
                    phmaseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(hmaOptionsMap, this.series.options.id)) {
                        console.log('HMA : Updating HMA values for main series ID : ', this.series.options.id);
                        updateHMASeries.call(this.series, this.x, true);
                    }
                });


                function updateHMASeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new data point
                    for (var key in hmaSeriesMap) {
                        if (hmaSeriesMap[key] && hmaSeriesMap[key].options && hmaSeriesMap[key].options.data && hmaSeriesMap[key].options.data.length > 0
                            && hmaOptionsMap[key].parentSeriesID === series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var hmaData = hmaOptionsMap[key].options.data;
                            var hmaOptions = hmaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var hmaValue = calculateHmaValue(data, hmaData, dataPointIndex, hmaOptions.period, hmaOptions.maType, this.options.type,key, isPointUpdate, hmaOptions.appliedTo);
                                if (isPointUpdate) {
                                    hmaSeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(hmaValue, 4) });
                                }
                                else {
                                    hmaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(hmaValue, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);
        }
    }
});
