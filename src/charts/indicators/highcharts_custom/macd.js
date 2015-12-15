/*
Created by Mahboob.M on 12.12.2015
*/
define(['indicator_base', 'highstock'],function(indicatorBase){

	 var macdOptionsMap = {} , macdSeriesMap = {} , signalSeriesMap = {} , histogramSeriesMap = {};
     var  ema1 = {} , ema2 = {} , ema3 = {};
     var fastEma = {} , slowEma = {};
     var maTypes = {SMA:"SMA", EMA:"EMA" ,WMA:"WMA" , TEMA:"TEMA" , TRIMA:"TRIMA"};

    //******************************Get Price*************************
    function getPrice(data,index,appliedTo,type)
    {
        if(data[index].length === 2)
        {
          return data[index][1];
        }
        else if (indicatorBase.isOHLCorCandlestick(type))
        {
            return indicatorBase.extractPriceForAppliedTO(appliedTo, data, index);
        }
        else {
            return indicatorBase.extractPrice(data, index); 
        }
    }
    //*************************SAM***************************************
    function calculateSMAValue(data,smaData,index,period,type,appliedTo)
    {
        if(index<period-1)
        {
            return null;
        }
        else if(index === (period-1))
        {
           var sum = 0.0;
           for (var i = 0; i < period; i++)
           {
              sum += getPrice(data,i,appliedTo,type);
           }
            return (sum / period);
        }
        else
        {
           var price = getPrice(data,index,appliedTo,type);
           //Calculate SMA - start
           //alert(Price);
           //alert(smaData[index-1][1]);
           var preSma = smaData[index-1].length?smaData[index-1][1]:smaData[index-1];
           return (preSma * (period - 1) + price) / period;
           //Calculate SMA - end
        }
    }
    //*************************EMA***************************************
    function calculateEMAValue(data,emaData,index,period,type,appliedTo)
    {
        if(index<period-1)
        { 
            return null;
        }
        else if(index === period-1)
        {
            var sum = 0;
            for (var i = 0 ; i<period ; i++)
            {
                sum += getPrice(data,index,appliedTo,type);
            }
            return sum/period;
        }
        else
        {
            //Calculate EMA - start
            //ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
            var preEma = emaData[index-1].length?emaData[index-1][1]:emaData[index-1];
            var price = getPrice(data,index,appliedTo,type);
            return (price * 2 / (period + 1)) + (preEma * (1 - 2 / (period + 1)));
        }
    }
    //*************************TEMA*****************************************
    function calculateTEMAValue(data,period) 
    {
        var temaData = [], sum = 0.0;
        for (var index = 0; index < period; index++) {
            sum += data[index][1];
            if (index === (period - 1)) {
                var val = sum / period;
                if (!$.isNumeric(val)) {
                    val = data[index][1];
                }
                temaData.push([data[index][0], val]);
            }
            else {
                temaData.push([data[index][0], null]);
            }
        }

        for (var index = period; index < data.length; index++) {
            var price = data[index][1];
            //Calculate EMA - start
            //ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
            var temaValue = (price * 2 / (period + 1)) + (temaData[index - 1][1] * (1 - 2 / (period + 1)))
            temaData.push([data[index][0], indicatorBase.toFixed(temaValue, 4)]);
            //Calculate EMA - end
        }
        return temaData;
    }

    function calculateTEMAData(data,period,type,appliedTo,key,hasDataIndex)
    {
        //Calculate TEMA data
        /*
        The Triple Exponential Moving Average (TEMA) of time series 't' is:
        *      EMA1 = EMA(t,period)
        *      EMA2 = EMA(EMA1,period)
        *      EMA3 = EMA(EMA2,period))
        *      TEMA = 3*EMA1 - 3*EMA2 + EMA3
        * Do not fill any value in temaData from 0 index to options.period-1 index
        */
        var inputData = [];
        //Prepare input data for indicator value calculation
        for (var index = 0; index < data.length; index++)
        {
            var price = getPrice(data,index,appliedTo,type);
            inputData.push([data[index].x ? data[index].x : data[index][0], price]);
        }
        var ema1Data = calculateTEMAValue(inputData,period);
        var ema2Data = calculateTEMAValue(ema1Data,period);
        var ema3Data = calculateTEMAValue(ema2Data,period);
        var temaData = [];
        for (var index = 0; index < ema3Data.length; index++) {
            var temaVal = 3 * ema1Data[index][1] - 3 * ema2Data[index][1] + ema3Data[index][1];
            if(hasDataIndex)
                temaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(temaVal , 4)]);
            else
                temaData.push(temaVal);
        }      
        ema1[key] = ema1Data;
        ema2[key] = ema2Data;
        ema3[key] = ema3Data;

        return temaData;
    }

    function calculateTEMAValueForUpdate(data,index,bbandsOptions,type,key,isPointUpdate)
    {
        var price = getPrice(data,index,bbandsOptions,type);
        var n = bbandsOptions.period;
        var ema1Value = (price * 2 / (n + 1)) + (ema1[key][index - 1][1] * (1 - 2 / (n + 1)))
            , ema2Value = (ema1Value * 2 / (n + 1)) + (ema2[key][index - 1][1] * (1 - 2 / (n + 1)))
            , ema3Value = (ema2Value * 2 / (n + 1)) + (ema3[key][index - 1][1] * (1 - 2 / (n + 1)));
        var temaValue = 3*ema1Value - 3*ema2Value + ema3Value;
        ema1Value = indicatorBase.toFixed(ema1Value, 4);
        ema2Value = indicatorBase.toFixed(ema2Value, 4);
        ema3Value = indicatorBase.toFixed(ema3Value, 4);
        temaValue = indicatorBase.toFixed(temaValue, 4);

        var time = (data[index].x || data[index][0]);
        if (isPointUpdate)
        {
            ema1[key][index] = [time, ema1Value];
            ema2[key][index] = [time, ema2Value];
            ema3[key][index] = [time, ema3Value];
        }
        else
        {
            ema1[key].push([time, ema1Value]);
            ema2[key].push([time, ema2Value]);
            ema3[key].push([time, ema3Value]);
        }
        return temaValue;
    }

   //*************************WMA******************************************   
    function calculateWMAValue(data,index,period,type,appliedTo) 
    {
        //Calculate WMA data
        /*
        WMA = ( Price * n + Price(1) * n-1 + ... Price( n-1 ) * 1) / ( n * ( n + 1 ) / 2 )
        Where: n = time period
        *
        *  Do not fill any value in wmaData from 0 index to options.period-1 index
        */
        if (index < period-1)
        {
           return null;
        }
        else
        {
           //Calculate WMA - start
           var wmaValue = 0;
           for (var subIndex = index, count = period; subIndex >= 0 && count >= 0; count--, subIndex--) 
           {
               var price = getPrice(data,subIndex,appliedTo,type);
               wmaValue += price * count;
           }
        }
        return wmaValue / (period * (period + 1) / 2);
        //Calculate WMA - end
    }
    
    //*************************TRIMA***************************************
    function calculateTRIMAValue(data,trimaData,index,period,type,appliedTo)
    {
        var Nm = Math.round( period + 1 / 2 );
        if (index < (Nm - 1))
        {
            return null;
        }
        else if(index === Nm-1)
        {
            var sum = 0;
            for (var subIndex = 0; subIndex < Nm; subIndex++)
            {
                sum += getPrice(data,subIndex,appliedTo,type);
            }
            return sum / Nm;
        }
        else
        {
            var price = getPrice(data,index,appliedTo,type);
            var preTrima = trimaData[index-1].length?trimaData[index-1][1]:trimaData[index-1];
            return (preTrima * (Nm - 1) + price) / Nm;
        }
    }

    //****************************MA****************************************
    function calculateMAValue(data,maData,index,period,maType,type,appliedTo)
    {
        var maValue=null;
        switch(maType)
        {
            case maTypes.SMA:
               maValue=calculateSMAValue(data,maData,index,period,type,appliedTo);
               break;
            case maTypes.EMA:
               maValue=calculateEMAValue(data,maData,index,period,type,appliedTo);
               break;
            case maTypes.WMA:
               maValue=calculateWMAValue(data,index,period,type,appliedTo);
               break;
            case maTypes.TEMA:
               maValue=calculateTEMAValue(data,maData,index,period,type,appliedTo);
               break;
            case maTypes.TRIMA:
               maValue= calculateTRIMAValue(data,maData,index,period,type,appliedTo);
               break;
        }
        return maValue;
    }

    //****************************MACD**************************************
    function calculateMACD(data,macdOptions,type,key)
    {
        var fastEmaData = [],slowEmaData = [],macdData=[];
        var macdValue = null;
        if(macdOptions.fastMaType === maTypes.TEMA)
        {
            fastEmaData = calculateTEMAData(data,macdOptions.fastPeriod,type,macdOptions.appliedTo,"f"+key,false);
        }
        if(macdOptions.slowMaType ===  maTypes.TEMA)
        {
            slowEmaData = calculateTEMAData(data,macdOptions.slowPeriod,type,macdOptions.appliedTo,"s"+key,false);
        }
        for (var index = 0; index < data.length; index++)
        {
            //*12 Day EMA
            if(macdOptions.fastMaType !=  maTypes.TEMA)
            {
                var fastEmaValue=calculateMAValue(data,fastEmaData,index,macdOptions.fastPeriod,macdOptions.fastMaType,type,macdOptions.appliedTo);
                fastEmaData.push(fastEmaValue);
            }
            //*26 Day EMA
            if(macdOptions.slowMaType !=  maTypes.TEMA)
            {
                var slowEmaValue=calculateMAValue(data,slowEmaData,index,macdOptions.slowPeriod,macdOptions.slowMaType,type,macdOptions.appliedTo);
                slowEmaData.push(slowEmaValue);
            }
            
            //*MACD Line: (12-day EMA - 26-day EMA)
            if(index >= macdOptions.slowPeriod)
            {
               macdValue = fastEmaData[index] - slowEmaData[index];
            }
            macdData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(macdValue , 4)]);
        }

        fastEma[key] = fastEmaData;
        slowEma[key] = slowEmaData;

        return macdData;
    }

    function calculateMACDValue(data,index,macdOptions,type,key,isPointUpdate)
    {
        var macdValue = null , fastEmaValue = null , slowEmaValue = null;

        if(macdOptions.fastMaType === maTypes.TEMA)
        {
            fastEmaValue = calculateTEMAValueForUpdate(data,macdOptions.fastPeriod,type,macdOptions.appliedTo,"f"+uniqueID,false);
        }
        else
        {
            fastEmaValue=calculateMAValue(data,fastEma[key],index,macdOptions.fastPeriod,macdOptions.fastMaType,type,macdOptions.appliedTo);
        }

        if(macdOptions.slowMaType ===  maTypes.TEMA)
        {
            slowEmaValue = calculateTEMAValueForUpdate(data,macdOptions.slowPeriod,type,macdOptions.appliedTo,"s"+uniqueID,false);
        }
        else
        {
            slowEmaValue=calculateMAValue(data,slowEma[key],index,macdOptions.slowPeriod,macdOptions.slowMaType,type,macdOptions.appliedTo);
        }
            
        //*MACD Line: (12-day EMA - 26-day EMA)
        if(index >= macdOptions.slowPeriod)
        {
            macdValue = fastEmaValue - slowEmaValue;
        }

         if (isPointUpdate)
        {
            fastEma[key][index] = fastEmaValue;
            slowEma[key][index] = slowEmaValue;
        }
        else
        {
            fastEma[key].push(fastEmaValue);
            slowEma[key].push(slowEmaValue);
        }

        return macdValue;
    }

    //****************************Signal************************************
    function calculateSignal(data,macdOptions,type,uniqueID)
    {
        var signalData = [];
        if(macdOptions.signalMaType == maTypes.TEMA)
        {
            signalData = calculateTEMAData(data,macdOptions.signalPeriod,type,macdOptions.appliedTo,"sg" + uniqueID,true);
        }
        else
        {
            for (var index = 0; index < data.length; index++)
            {
                //*Signal Line: 9-day EMA of MACD Line
                var signalEma = calculateMAValue(data,signalData,index,macdOptions.signalPeriod + macdOptions.slowPeriod-1,macdOptions.signalMaType,type,macdOptions.appliedTo);
                signalData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(signalEma , 4)]);
            }
        }
        return signalData;
    }

    function calculateSignalValue(data,signalData,index,macdOptions,type,key,isPointUpdate)
    {
        var signalValue = null;
        if(macdOptions.signalMaType === maTypes.TEMA)
        {
            signalValue = calculateTEMAValueForUpdate(data,macdOptions.signalPeriod,type,macdOptions.appliedTo,"sg"+uniqueID,false);
        }
        else
        {
            //*Signal Line: 9-day EMA of MACD Line
            signalValue = calculateMAValue(data,signalData,index,macdOptions.signalPeriod + macdOptions.slowPeriod-1,macdOptions.signalMaType,type,macdOptions.appliedTo);
        }
        return signalValue;
    }

    //****************************Histogram************************************
    function calculateHistogram(macdData,signalData)
    {
        var histogramData = [];
        for (var index = 0; index < macdData.length; index++)
        {
             var hstgrmEma = null;
            //*MACD Histogram: MACD Line - Signal Line
            var macdValue = macdData[index][1] || macdData[index].y;
            var signalValue = signalData[index][1] || signalData[index].y;
            if(macdValue && signalValue)
               hstgrmEma = macdValue - signalValue;
            histogramData.push([(macdData[index].x || macdData[index][0]), indicatorBase.toFixed(hstgrmEma , 4)]);
        }
        return histogramData;
    }

    function calculateHistogramValue(macdData,signalData,index)
    {
        var hstgrmEma = null;
        //*MACD Histogram: MACD Line - Signal Line
        var macdValue = macdData[index][1] || macdData[index].y;
        var signalValue = signalData[index][1] || signalData[index].y;
        if(macdValue && signalValue)
           hstgrmEma = macdValue - signalValue;
       return hstgrmEma;
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

                        var macdData = calculateMACD(data,macdOptions,this.options.type,macdUniqueID);

                        var signalData = calculateSignal(macdData,macdOptions,this.options.type,signalUniqueID);

                        var histogramData = calculateHistogram(macdData,signalData);

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
                           // plotLines: bopOptions.levels
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
                        if(macdOptionsMap[key].maType === "TEMA")
                        {
                            ema1Data[key] = [];
                            ema2Data[key] = [];
                            ema3Data[key] = [];
                        }
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
                                var macdValue = calculateMACDValue(data,dataPointIndex,macdOptions,this.options.type,key,isPointUpdate && macdSeriesMap[key].options.data.length >= data.length)
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
                            console.log(key,macdKey)
                            if ( dataPointIndex >= 1) {
                                var signalValue =calculateSignalValue(macdData,signalData,dataPointIndex,macdOptions,this.options.type,key,isPointUpdate && signalSeriesMap[key].options.data.length >= data.length);
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
