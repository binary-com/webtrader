/*
Created by Mahboob.M on 12.16.2015
*/
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var wclpriceOptionsMap = {}, wclpriceSeriesMap = {};

    //*************************WCLPRIC***************************************
    function calculateWCLPRICEValue(data, index, type) {
        var closePeice =indicatorBase.getPrice(data, index, indicatorBase.CLOSE, type);
        var highPeice =indicatorBase.getPrice(data, index, indicatorBase.HIGH, type);
        var lowPeice =indicatorBase.getPrice(data, index, indicatorBase.LOW, type);
        //((Close * 2)+High + Low) / 4
        return ((closePeice * 2) + highPeice + lowPeice) / 4
    }
   
    //*************************INIT***************************************
    return {
        init: function () {
            (function (H, $, indicatorBase) {
                if (!H || H.Series.prototype.addWCLPRICE) return;

                H.Series.prototype.addWCLPRICE = function (wclpriceOptions) {
                    var seriesID = this.options.id;
                    wclpriceOptions = $.extend({
                        strokeColor: 'red',
                        strokeWidth: 1,
                        dashStyle: 'line',
                        parentSeriesID: seriesID
                    }, wclpriceOptions);

                    var uniqueID = '_'+ new Date().getTime();

                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        //*Calculate WCLPRICE 
                        //*((Close * 2) + High + Low) / 4
                        var wclPriceData = [];
                        for (var index = 0; index < data.length; index++) {
                            var wclpriceValue = calculateWCLPRICEValue(data, index, this.options.type);
                            wclPriceData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(wclpriceValue, 4)]);
                        }

                        var chart = this.chart;

                        wclpriceOptionsMap[uniqueID] = wclpriceOptions;

                        //WCLPRICE 
                        var series = this;
                        wclpriceSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'WCLPRICE',
                            data: wclPriceData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: wclpriceOptions.strokeColor,
                            lineWidth: wclpriceOptions.strokeWidth,
                            dashStyle: wclpriceOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                 
                        $(wclpriceSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'wclprice',
                            isIndicator: true,
                            parentSeriesID: wclpriceOptions.parentSeriesID
                        });

                        chart.redraw();
                    }
                };

                H.Series.prototype.removeWCLPRICE = function (uniqueID) {
                    var chart = this.chart;
                    wclpriceOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    wclpriceSeriesMap[uniqueID] = null;
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckWCLPRICE = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: wclpriceOptionsMap[uniqueID] != null
                    };
                };

                H.wrap(H.Series.prototype, 'addPoint', function (pwclpriceseed, options, redraw, shift, animation) {
                    pwclpriceseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(wclpriceOptionsMap, this.options.id)) {
                        updateWCLPRICELineSeries.call(this, options[0]);
                    }
                });

                H.wrap(H.Point.prototype, 'update', function (pwclpriceseed, options, redraw, animation) {
                    pwclpriceseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(wclpriceOptionsMap, this.series.options.id)) {
                        console.log('WCLPRICE : Updating WCLPRICE values for main series ID : ', this.series.options.id);
                        updateWCLPRICELineSeries.call(this.series, this.x, true);
                    }
                });


                function updateWCLPRICELineSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new data point
                    for (var key in wclpriceSeriesMap) {
                        if (wclpriceSeriesMap[key] && wclpriceSeriesMap[key].options && wclpriceSeriesMap[key].options.data && wclpriceSeriesMap[key].options.data.length > 0
                            && wclpriceOptionsMap[key].parentSeriesID === series.options.id
                            && wclpriceSeriesMap[key].chart === chart
                        ) {
                            //Find the data point
                            var data = series.options.data;
                            var wclpriceOptions = wclpriceOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var wclrPriceValue = calculateWCLPRICEValue(data, dataPointIndex, this.options.type)
                                if (isPointUpdate && wclpriceSeriesMap[key].options.data.length >= data.length) {
                                    wclpriceSeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(wclrPriceValue, 4) });
                                }
                                else {
                                    wclpriceSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(wclrPriceValue, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);
        }
    }
});
