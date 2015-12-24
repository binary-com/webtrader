/**
 * Created by Mahboob.M on 12/20/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var t3OptionsMap = {}, t3SeriesMap = {};
    var t3Ema1 = {}, t3Ema2 = {}, gd1 = {}, gd2 = {};

    //*************************DEMA*****************************************
    function calculateGD(options) {
        //Calculate T3 data
        /*
        EMA1 = EMA(x,Period)

        EMA2 = EMA(EMA1,Period)

        GD = EMA1*(1+vFactor)) - (EMA2*vFactor)

        Where vFactor is a volume factor between 0 and 1 which determines how the moving averages responds. A value of 0 returns an EMA. A value of 1 returns DEMA. 
        Tim Tillson advised or preferred a value of 0.7.
         */

        var time = (options.data[options.index].x || options.data[options.index][0]);
        if (options.index === 0) {
            t3Ema1[options.key] = [], t3Ema2[options.key] = [];
        }

        var ma1Options = {
            data: options.data,
            maData: t3Ema1[options.key],
            index: options.index,
            period: options.period,
            type: options.type,
            appliedTo: options.appliedTo,
            isIndicatorData: options.isIndicatorData
        };
        var t3Ema1Value = indicatorBase.calculateEMAValue(ma1Options);
        if (options.isPointUpdate) {
            t3Ema1[options.key][options.index] = [time, t3Ema1Value];
        }
        else {
            t3Ema1[options.key].push([time, t3Ema1Value]);
        }

        var ma2Options = {
            data: t3Ema1[options.key],
            maData: t3Ema2[options.key],
            index: options.index,
            period: options.period,
            type: options.type,
            appliedTo: options.appliedTo,
            isIndicatorData: true
        };
        var t3Ema2Value = indicatorBase.calculateEMAValue(ma2Options);

        if (options.isPointUpdate) {
            t3Ema2[options.key][options.index] = [time, t3Ema2Value];
        }
        else {
            t3Ema2[options.key].push([time, t3Ema2Value]);
        }

        return (t3Ema1Value * (1 + options.vFactor)) - (t3Ema2Value * options.vFactor);
    };


    function calculateT3Value(t3Options) {
        //T3 = GD(GD(GD(t, Period, vFactor), Period, vFactor), Period, vFactor);
        var time = (t3Options.data[t3Options.index].x || t3Options.data[t3Options.index][0]);

        if (t3Options.index === 0) {
            gd1[t3Options.key] = [], gd2[t3Options.key] = [];
        }

        var gd1Options =
        {
            data: t3Options.data,
            index: t3Options.index,
            period: t3Options.period,
            vFactor: t3Options.vFactor,
            type: t3Options.type,
            key: 'g1' + t3Options.key,
            isPointUpdate: t3Options.isPointUpdate,
            appliedTo: t3Options.appliedTo,
            isIndicatorData: false
        }
        var gd1value = calculateGD(gd1Options);
        if (t3Options.isPointUpdate) {
            gd1[t3Options.key][t3Options.index] = [time, gd1value];
        }
        else {
            gd1[t3Options.key].push([time, gd1value]);
        }

        var gd2Options =
        {
            data: gd1[t3Options.key],
            index: t3Options.index,
            period: t3Options.period,
            vFactor: t3Options.vFactor,
            type: t3Options.type,
            key: 'g2' + t3Options.key,
            isPointUpdate: t3Options.isPointUpdate,
            appliedTo: t3Options.appliedTo,
            isIndicatorData: true
        }
        var gd2value = calculateGD(gd2Options);
        if (t3Options.isPointUpdate) {
            gd2[t3Options.key][t3Options.index] = [time, gd2value];
        }
        else {
            gd2[t3Options.key].push([time, gd2value]);
        }

        var gd3Options =
        {
            data: gd2[t3Options.key],
            index: t3Options.index,
            period: t3Options.period,
            vFactor: t3Options.vFactor,
            type: t3Options.type,
            key: 'g3' + t3Options.key,
            isPointUpdate: t3Options.isPointUpdate,
            appliedTo: t3Options.appliedTo,
            isIndicatorData: true
        }
        return calculateGD(gd3Options);
    }

    return {
        init: function () {

            (function (H, $, indicatorBase) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addT3) return;

                H.Series.prototype.addT3 = function (t3Options) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    t3Options = $.extend({
                        period: 21,
                        vFactor:0.7,
                        stroke: 'red',
                        strokeWidth: 2,
                        dashStyle: 'line',
                        levels: [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID: seriesID
                    }, t3Options);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add ATR series to the chart
                    var data = this.options.data || [];
                    //If period is higher than data.length, we cannot calculate t3. Return from here
                    if (t3Options.period >= data.length) return;

                    if (data && data.length > 0) {

                        //Calculate T3 data
                        /*
                        EMA1 = EMA(x,Period)
                
                        EMA2 = EMA(EMA1,Period)
                
                        GD = EMA1*(1+vFactor)) - (EMA2*vFactor)
                
                        T3 = GD (GD ( GD(t, Period, vFactor), Period,vFactor), Period, vFactor);
                
                        Where vFactor is a volume factor between 0 and 1 which determines how the moving averages responds. A value of 0 returns an EMA. A value of 1 returns DEMA. 
                        Tim Tillson advised or preferred a value of 0.7.
                         */

                        var t3Data = [];
                        for (var index = 0; index < data.length; index++) {
                            var tOptions =
                                {
                                    data: data,
                                    index: index,
                                    period: t3Options.period,
                                    vFactor: t3Options.vFactor,
                                    type: this.options.type,
                                    key: uniqueID,
                                    isPointUpdate: false,
                                    appliedTo: t3Options.appliedTo,
                                    isIndicatorData: false
                                };
                            var maValue = calculateT3Value(tOptions);
                            t3Data.push([(data[index].x || data[index][0]), indicatorBase.toFixed(maValue, 4)]);
                        };

                        var chart = this.chart;

                        t3OptionsMap[uniqueID] = t3Options;

                        var series = this;
                        t3SeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'T3 (' + t3Options.period + ', ' + t3Options.vFactor + ', ' + indicatorBase.appliedPriceString(t3Options.appliedTo) + ')',
                            data: t3Data,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: t3Options.stroke,
                            lineWidth: t3Options.strokeWidth,
                            dashStyle: t3Options.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(t3SeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 't3',
                            isIndicator: true,
                            parentSeriesID: t3Options.parentSeriesID,
                            period: t3Options.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeT3 = function (key) {
                    var chart = this.chart;
                    t3OptionsMap[key] = null;
                    chart.get(key).remove();
                    t3SeriesMap[key] = null;
                    t3Ema1['g1' + key] = [], t3Ema1['g2' + key] = [], t3Ema1['g3' + key] = [];
                    t3Ema2['g1' + key] = [], t3Ema2['g2' + key] = [], t3Ema2['g3' + key] = [];
                    gd1[key] = []; gd2[key] = [];
                };

                H.Series.prototype.preRemovalCheckT3 = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        period: !t3OptionsMap[uniqueID] ? undefined : t3OptionsMap[uniqueID].period,
                        appliedTo: !t3OptionsMap[uniqueID] ? undefined : t3OptionsMap[uniqueID].appliedTo,
                        isValidUniqueID: t3OptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(t3OptionsMap, this.options.id)) {
                        updateT3Series.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(t3OptionsMap, this.series.options.id)) {
                        updateT3Series.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 */
                function updateT3Series(time, isPointUpdate) {
                    //if this is T3 series, ignore
                    var series = this;
                    var chart = series.chart;

                    //Add a new T3 data point
                    for (var key in t3SeriesMap) {
                        if (t3SeriesMap[key] && t3SeriesMap[key].options && t3SeriesMap[key].options.data && t3SeriesMap[key].options.data.length > 0
                            && t3OptionsMap[key].parentSeriesID == series.options.id) {
                            //This is T3 series. Add one more T3 point
                            //Calculate T3 data
                            /*
                            EMA1 = EMA(x,Period)
                    
                            EMA2 = EMA(EMA1,Period)
                    
                            GD = EMA1*(1+vFactor)) - (EMA2*vFactor)
                    
                            T3 = GD (GD ( GD(t, Period, vFactor), Period,vFactor), Period, vFactor);
                    
                            Where vFactor is a volume factor between 0 and 1 which determines how the moving averages responds. A value of 0 returns an EMA. A value of 1 returns DEMA. 
                            Tim Tillson advised or preferred a value of 0.7.
                             */
                            //Find the data point
                            var data = series.options.data;
                            var t3Data = t3SeriesMap[key].options.data;
                            var t3Options = t3OptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var tOptions =
                                {
                                    data: data,
                                    index: dataPointIndex,
                                    period: t3Options.period,
                                    vFactor: t3Options.vFactor,
                                    type: this.options.type,
                                    key: key,
                                    isPointUpdate: isPointUpdate,
                                    appliedTo: t3Options.appliedTo,
                                    isIndicatorData: false
                                }
                                var t3Value = calculateT3Value(tOptions);

                                if (isPointUpdate) {
                                    t3SeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(t3Value, 4) });
                                }
                                else {
                                    t3SeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(t3Value, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    }

});
