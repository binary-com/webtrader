/*
Created by Mahboob.M on 12.16.2015
*/
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var cciOptionsMap = {}, cciSeriesMap = {};
    var maData = {}, tpData = {}, mDevData = {};

    function calculateCciValue(data, index, period, maType, type, key, isPointUpdate)
    {
        
        //* Calculate CCI FORMULA
        //* CCI = ( M - A ) / ( 0.015 * D )
        //* Where:
        //* M = ( H + L + C ) /        //* 3
        //* H = Highest price for        //* the period
        //* L = Lowest price for        //* the period
        //* C = Closing price for        //* the period
        //* A = n period moving        //* average of M
        //* D = mean deviation        //* of the absolute value of the difference between the mean price and        //* the moving average of mean prices, M - A
        //*Typical Price (TP) = (High + Low + Close)/3
        var tpValue = (indicatorBase.getPrice(data, index, indicatorBase.HIGH, type) + indicatorBase.getPrice(data, index, indicatorBase.LOW, type) + indicatorBase.getPrice(data, index, indicatorBase.CLOSE,type)) / 3;
        var time = (data[index][0] || data[index].x);
        if (isPointUpdate)
        {
            tpData[key][index] = [time, tpValue];
        }
        else
        {
            tpData[key].push([time, tpValue]);
        }


        if (index < period - 1) {
            maData[key].push([time,null]);
            mDevData[key].push([time,null]);
            return null;
        }
        else {
            //* Calculate Ma Type
            //if (maType === indicatorBase.TEMA) {
            //    var maValue = indicatorBase.calculateTEMAValue(tpData[key], index, period, type, key, isPointUpdate);
            //}
            //else {
            var maValue = indicatorBase.calculateMAValue(tpData[key], maData[key], index, period, maType, type, key, isPointUpdate);
            //}

            //*Calculate Mean Deviation
            //*mean deviation of the absolute value of the difference between the mean price and  the moving average of mean prices, M - A
            var sum = 0;
            for (var i = 0; i < period - 1; i++) {
                sum += Math.abs(maValue - tpData[key][index - i][1]);
            }
            var mDevValue = sum / period;

            //* Calculate CCI 
            //* CCI = ( M - A ) / ( 0.015 * D )
            var cciValue = (tpValue - maValue) / (.015 * mDevValue);
            if (isPointUpdate) {
                maData[key][index] = [time,maValue];
                mDevData[key][index]= [time,mDevValue];
            }
            else
            {
                maData[key].push([time, maValue]);
                mDevData[key].push([time, mDevValue]);
            }

            return cciValue;
        }
    }

    //*************************INIT***************************************
    return {
        init: function () {
            (function (H, $, indicatorBase) {
                if (!H || H.Series.prototype.addCCI) return;

                H.Series.prototype.addCCI = function (cciOptions) {
                    var seriesID = this.options.id;
                    cciOptions = $.extend({
                        period: 20,
                        maType:"SMA",
                        strokeColor: 'red',
                        strokeWidth: 1,
                        dashStyle: 'line',
                        parentSeriesID: seriesID
                    }, cciOptions);

                    var uniqueID = '_' + new Date().getTime();

                    var data = this.options.data || [];
                    if (data && data.length > 0) {

                        var cciData = [];
                        tpData[uniqueID] = [], maData[uniqueID] = [], mDevData[uniqueID] = [];
                        for (var index = 0; index < data.length; index++) {
                            var cciValue=calculateCciValue(data,index,cciOptions.period,cciOptions.maType,this.options.type,uniqueID);
                            cciData.push([(data[index][0] || data[index].x), indicatorBase.toFixed(cciValue, 4)]);
                        }

                        var chart = this.chart;

                        cciOptionsMap[uniqueID] = cciOptions;

                        chart.addAxis({ // Secondary yAxis
                            id: 'cci' + uniqueID,
                            title: {
                                text: 'CCI',
                                align: 'high',
                                offset: 0,
                                rotation: 0,
                                y: 10,
                                x: 35
                            },
                            lineWidth: 2
                        }, false, false, false);

                        indicatorBase.recalculate(chart);

                        //CCI 
                        var series = this;
                        cciSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'CCI (' + cciOptions.period +')',
                            data: cciData,
                            type: 'line',
                            yAxis: 'cci' + uniqueID,
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: cciOptions.strokeColor,
                            lineWidth: cciOptions.strokeWidth,
                            dashStyle: cciOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);


                        $(cciSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'cci',
                            isIndicator: true,
                            parentSeriesID: cciOptions.parentSeriesID
                        });

                        chart.redraw();
                    }
                };

                H.Series.prototype.removeCCI= function (uniqueID) {
                    var chart = this.chart;
                    cciOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    cciSeriesMap[uniqueID] = null;
                    chart.get('cci' + uniqueID).remove(false);
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckCCI = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        isValidUniqueID: cciOptionsMap[uniqueID] != null
                    };
                };

                H.wrap(H.Series.prototype, 'addPoint', function (pcciseed, options, redraw, shift, animation) {
                    pcciseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cciOptionsMap, this.options.id)) {
                        updateCCISeries.call(this, options[0]);
                    }
                });

                H.wrap(H.Point.prototype, 'update', function (pcciseed, options, redraw, animation) {
                    pcciseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(cciOptionsMap, this.series.options.id)) {
                        console.log('CCI : Updating CCI values for main series ID : ', this.series.options.id);
                        updateCCISeries.call(this.series, this.x, true);
                    }
                });


                function updateCCISeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new data point
                    for (var key in cciSeriesMap) {
                        if (cciSeriesMap[key] && cciSeriesMap[key].options && cciSeriesMap[key].options.data && cciSeriesMap[key].options.data.length > 0
                            && cciOptionsMap[key].parentSeriesID === series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var cciOptions = cciOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var cciValue = calculateCciValue(data, dataPointIndex, cciOptions.period, cciOptions.maType, this.options.type, key, isPointUpdate);
                                if (isPointUpdate) {
                                    cciSeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(cciValue, 4) });
                                }
                                else {
                                    cciSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(cciValue, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);
        }
    }
});
