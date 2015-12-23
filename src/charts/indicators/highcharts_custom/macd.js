/*
Created by Mahboob.M on 12.12.2015
*/
define(['indicator_base', 'highstock'],function(indicatorBase){

	 var macdOptionsMap = {} , macdSeriesMap = {} , signalSeriesMap = {} , histogramSeriesMap = {};
     var fastEma = {} , slowEma = {};

    //****************************MACD************************************
     function calculateMACDValue(data, index, macdOptions, type, key, isPointUpdate) {
         var time = (data[index].x || data[index][0]);
         var macdValue = null;
         //*12 Day EMA
         var fastMaOptions = {
             data: data,
             maData: fastEma[key],
             index: index,
             period: macdOptions.fastPeriod,
             maType: macdOptions.fastMaType,
             type: type,
             key: 'f' + key,
             isPointUpdate: isPointUpdate,
             appliedTo: macdOptions.appliedTo,
             isIndicatorData: false
         };
         var fastEmaValue = indicatorBase.calculateMAValue(fastMaOptions);
         //*26 Day EMA
         var slowMaOptions = {
             data: data,
             maData: slowEma[key],
             index: index,
             period: macdOptions.slowPeriod,
             maType: macdOptions.slowMaType,
             type: type,
             key: 's' + key,
             isPointUpdate: isPointUpdate,
             appliedTo: macdOptions.appliedTo,
             isIndicatorData: false
         };
         var slowEmaValue = indicatorBase.calculateMAValue(slowMaOptions);
         //*MACD Line: (12-day EMA - 26-day EMA)
         if (index >= macdOptions.slowPeriod) {
             macdValue = fastEmaValue - slowEmaValue;
         }
         if (isPointUpdate) {
             fastEma[key][index] = [time,fastEmaValue];
             slowEma[key][index] = [time,slowEmaValue];
         }
         else {
             fastEma[key].push([time, fastEmaValue]);
             slowEma[key].push([time, slowEmaValue]);
         }
         return macdValue;
     }
    
    //****************************Histogram************************************
    function calculateHistogramValue(macdData,signalData,index)
    {
        var hstgrmValue = null;
        //*MACD Histogram: MACD Line - Signal Line
        var macdValue = indicatorBase.getIndicatorData(macdData, index);//macdData[index][1] || macdData[index].y;
        var signalValue = indicatorBase.getIndicatorData(signalData, index);// signalData[index][1] || signalData[index].y;
        //console.log(macdValue, signalValue);
        if (macdValue && signalValue)
            hstgrmValue = macdValue - signalValue;
        return hstgrmValue;
    }

    //*************************End Histogram************************************

    return {
    	init:function(){
    		  (function(H,$,indicatorBase) {
    		  	if (!H || H.Series.prototype.addMACD) return;

                H.Series.prototype.addMACD = function ( macdOptions ) {
                    var seriesID = this.options.id;
                    macdOptions = $.extend({
                        fastPeriod: 12,
                        slowPeriod:26,
                        signalPeriod:9,
                        fastMaType:"EMA",
                        slowMaType:"EMA",
                        signalMaType:"EMA",
                        macdStroke: 'red',
                        signalLineStroke:'#A52A2A',
                        macdHstgrmColor:'#A52A2A',
                        strokeWidth: 1,
                        dashStyle: 'line',
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID: seriesID
                    }, macdOptions);

                    var uniqueID =  new Date().getTime();
                    var macdUniqueID ="m-" + uniqueID;
                    var signalUniqueID ="s-" + uniqueID;
                    var hstgrmUniqueID ="h-" + uniqueID;

                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {
                        //*Calculate MACD 
                        //*MACD Line: (12-day EMA - 26-day EMA)
                        //* Signal Line: 9-day EMA of MACD Line
                        //* MACD Histogram: MACD Line - Signal Line
                        var macdData = [];
                        fastEma[macdUniqueID] = [], slowEma[macdUniqueID] = [];
                        for (var index = 0; index < data.length; index++) {
                            var macdValue = calculateMACDValue(data, index, macdOptions, this.options.type, macdUniqueID, false);
                            macdData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(macdValue, 4)]);
                        }

                        var signalData = [];
                        for (var index = 0; index < macdData.length; index++) {
                            var maOptions = {
                                data: macdData,
                                maData: signalData,
                                index: index,
                                period: macdOptions.signalPeriod + macdOptions.slowPeriod - 1,
                                maType: macdOptions.signalMaType,
                                type: this.options.type,
                                key: signalUniqueID,
                                isPointUpdate: false,
                                appliedTo: macdOptions.appliedTo,
                                isIndicatorData: true
                            };
                            var signalValue = indicatorBase.calculateMAValue(maOptions);
                            signalData.push([(macdData[index].x || macdData[index][0]), indicatorBase.toFixed(signalValue, 4)]);
                        }

                        var histogramData = [];
                        for (var index = 0; index < macdData.length; index++) {
                            var hstgrmValue = calculateHistogramValue(macdData, signalData, index);
                            histogramData.push([(macdData[index].x || macdData[index][0]), indicatorBase.toFixed(hstgrmValue, 4)]);
                        }

   						var chart = this.chart;
 
                        macdOptionsMap[macdUniqueID] = macdOptions;
                        macdOptionsMap[signalUniqueID] = macdOptions;
                        macdOptionsMap[hstgrmUniqueID] = macdOptions;

                        chart.addAxis({ // Secondary yAxis
                            id: 'macd'+ macdUniqueID,
                            title: {
                                text: 'MACD',
                                align: 'high',
                                offset: 0,
                                rotation: 0,
                                y: 10, 
                                x: 35
                            },
                            lineWidth: 2
                        }, false, false, false);

                        indicatorBase.recalculate(chart);

                         //Histogram Line
                        var series = this;
                        histogramSeriesMap[hstgrmUniqueID] = chart.addSeries({
                            id: hstgrmUniqueID,
                            name: 'MACD (HISTOGRAM, ' + indicatorBase.appliedPriceString(macdOptions.appliedTo) + ')',
                            data: histogramData,
                            type: 'column',
                            yAxis:'macd' + macdUniqueID,
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: macdOptions.macdHstgrmColor,
                            lineWidth: macdOptions.strokeWidth,
                            dashStyle: macdOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //MACD Line
                        var series = this;
                        macdSeriesMap[macdUniqueID] = chart.addSeries({
                            id: macdUniqueID,
                            name: 'MACD (' + macdOptions.fastPeriod +',' + indicatorBase.appliedPriceString(macdOptions.appliedTo) + ')',
                            data: macdData,
                            type: 'line',
                            yAxis:'macd' + macdUniqueID,
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: macdOptions.macdStroke,
                            lineWidth: macdOptions.strokeWidth,
                            dashStyle: macdOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //Signal Line
                        var series = this;
                        signalSeriesMap[signalUniqueID] = chart.addSeries({
                            id: signalUniqueID,
                            name: 'MACD (SIGNAL,' + macdOptions.signalPeriod +',' + indicatorBase.appliedPriceString(macdOptions.appliedTo) + ')',
                            data: signalData,
                            type: 'line',
                            yAxis:'macd' + macdUniqueID,
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: macdOptions.signalLineStroke,
                            lineWidth: macdOptions.strokeWidth,
                            dashStyle: macdOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        $(histogramSeriesMap[hstgrmUniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'macd',
                            isIndicator: true,
                            parentSeriesID: macdOptions.parentSeriesID,
                            period: macdOptions.slowPeriod
                        });

                        $(macdSeriesMap[macdUniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'macd',
                            isIndicator: true,
                            parentSeriesID: macdOptions.parentSeriesID,
                            period: macdOptions.fastPeriod
                        });

                        $(signalSeriesMap[signalUniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'macd',
                            isIndicator: true,
                            parentSeriesID: macdOptions.parentSeriesID,
                            period: macdOptions.signalPeriod
                        });

                        chart.redraw();
                    }
                 };

                H.Series.prototype.removeMACD = function (uniqueID) 
                {
                    var chart = this.chart;
                    var datePart = uniqueID.replace("m-", "").replace('s-', "").replace('h-', '');
                    ['m', 's', 'h'].forEach(function(eachSeriesType) {
                        var key = eachSeriesType + '-' + datePart;
                        macdOptionsMap[key] = null;
                        chart.get(key).remove();
                        macdSeriesMap[key] = null;
                        signalSeriesMap[key] = null;
                        histogramSeriesMap[key] = null;
                    });

                    chart.get('macd' + uniqueID).remove(false);
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckMACD = function(uniqueID) {
                    var indicatorName = undefined;
                    if (macdOptionsMap[uniqueID]) {
                        indicatorName = 'MACD (' + macdOptionsMap[uniqueID].fastPeriod + ',' +macdOptionsMap[uniqueID].slowPeriod + ',' + macdOptionsMap[uniqueID].signalPeriod +',' + indicatorBase.appliedPriceString(macdOptionsMap[uniqueID].appliedTo) + ')';
                    }
                  return {
                      isMainIndicator : uniqueID.indexOf("m-") === 0,
                      fastPeriod : !macdOptionsMap[uniqueID] ? undefined : macdOptionsMap[uniqueID].fastPeriod,
                      slowPeriod : !macdOptionsMap[uniqueID] ? undefined : macdOptionsMap[uniqueID].slowPeriod,
                      signalPeriod: !macdOptionsMap[uniqueID] ? undefined : macdOptionsMap[uniqueID].signalPeriod,
                      fastMaType: !macdOptionsMap[uniqueID] ? undefined : macdOptionsMap[uniqueID].fastMaType,
                      slowMaType: !macdOptionsMap[uniqueID] ? undefined : macdOptionsMap[uniqueID].slowMaType,
                      signalMaType : !macdOptionsMap[uniqueID] ? undefined : macdOptionsMap[uniqueID].signalMaType,
                      isValidUniqueID : macdOptionsMap[uniqueID] != null,
                      indicatorName : indicatorName
                  };
                };

                H.wrap(H.Series.prototype, 'addPoint', function(pmacdseed, options, redraw, shift, animation) {
                    pmacdseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(macdOptionsMap, this.options.id)) {
                        updateMACDLineSeries.call(this, options[0]);
                        updateSignalLineSeries.call(this,options[0]);
                        updateHistogramSeries.call(this,options[0]);
                    }
                });

                H.wrap(H.Point.prototype, 'update', function(pmacdseed, options, redraw, animation) {
                    pmacdseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(macdOptionsMap, this.series.options.id)) {
                        console.log('MACD : Updating MACD values for main series ID : ', this.series.options.id);
                        updateMACDLineSeries.call(this.series, this.x, true);
                        updateSignalLineSeries.call(this.series, this.x, true);
                        updateHistogramSeries.call(this.series, this.x, true);
                    }
                });
 

 				function updateMACDLineSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new data point
                    for (var key in macdSeriesMap) {
                        if (macdSeriesMap[key] && macdSeriesMap[key].options && macdSeriesMap[key].options.data && macdSeriesMap[key].options.data.length > 0
                            && macdOptionsMap[key].parentSeriesID == series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var macdOptions=macdOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var macdValue = calculateMACDValue(data, dataPointIndex, macdOptions, this.options.type, key, isPointUpdate)
                                if (isPointUpdate)
                                {
                                    macdSeriesMap[key].data[dataPointIndex].update({ y : indicatorBase.toFixed(macdValue,4)});
                                }
                                else
                                {
                                    macdSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(macdValue,4)], true, true, false);
                                }
                            }
                        }
                    }
				}

                function updateSignalLineSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new data point
                    for (var key in signalSeriesMap) {
                        if (signalSeriesMap[key] && signalSeriesMap[key].options && signalSeriesMap[key].options.data && signalSeriesMap[key].options.data.length > 0
                            && macdOptionsMap[key].parentSeriesID == series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var macdOptions=macdOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            var signalData = signalSeriesMap[key].options.data;
                            var macdKey = key.replace('s','m');
                            var macdData = macdSeriesMap[macdKey].options.data;
                            if (dataPointIndex >= 1) {
                                var maOptions = {
                                    data: macdData,
                                    maData: signalData,
                                    index: dataPointIndex,
                                    period: macdOptions.signalPeriod + macdOptions.slowPeriod - 1,
                                    maType: macdOptions.signalMaType,
                                    type: this.options.type,
                                    key: key,
                                    isPointUpdate: isPointUpdate,
                                    appliedTo: macdOptions.appliedTo,
                                    isIndicatorData: true
                                };
                                var signalValue = indicatorBase.calculateMAValue(maOptions);
                                if(signalValue && !isNaN(signalValue))
                                {
                                    if (isPointUpdate)
                                    {
                                        signalSeriesMap[key].data[dataPointIndex].update({ y : indicatorBase.toFixed(signalValue,4)});
                                    }
                                    else
                                    {
                                        signalSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(signalValue,4)], true, true, false);
                                    }
                                }
                            }
                        }
                    }
                }
                
                function updateHistogramSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new data point
                    for (var key in histogramSeriesMap) {
                        if (histogramSeriesMap[key] && histogramSeriesMap[key].options && histogramSeriesMap[key].options.data && histogramSeriesMap[key].options.data.length > 0
                            && macdOptionsMap[key].parentSeriesID == series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var macdKey=key.replace('h','m');
                            var macdData = macdSeriesMap[macdKey].options.data;
                            var signalKey = key.replace('h','s');
                            var signalData = signalSeriesMap[signalKey].options.data;

                            var macdOptions=macdOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var histogramValue = calculateHistogramValue(macdData,signalData,dataPointIndex)
                                if (isPointUpdate)
                                {
                                    histogramSeriesMap[key].data[dataPointIndex].update({ y : indicatorBase.toFixed(histogramValue,4)});
                                }
                                else
                                {
                                    histogramSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(histogramValue,4)], true, true, false);
                                }
                            }
                        }
                    }
                }
				
    		  })(Highcharts, jQuery,indicatorBase);
    	}
    }
});
