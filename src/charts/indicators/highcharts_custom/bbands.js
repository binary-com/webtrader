/*
Created by Mahboob.M on 26.11.2015
*/
define(['jquery', 'indicator_base', 'highcharts-more'],function($, indicatorBase) {

	var bbandsOptionsMap = {}, 
	    bbandsMdlSeriesMap = {},
	    bbandsUprSeriesMap = {},
	    bbandsLwrSeriesMap = {};
    var  ema1 = {}, ema2 = {}, ema3 = {};

    //******************************Get Price*************************
    function getPrice(data,index,bbandsOptions,type)
    {
    	var price = 0.0;
        if (indicatorBase.isOHLCorCandlestick(type)) {
            price = indicatorBase.extractPriceForAppliedTO(bbandsOptions.appliedTo, data, index);
        }
        else {
            price = indicatorBase.extractPrice(data, index); 
        }
        return price;
    }
    
    //*************************Standard Deviation**********************
    function calculateStandardDeviation(data,index,bbandsOptions,type,average)
    {
    	// Standard Dviation :
  		// 	1-Calculate the average (mean) price for the number of periods or observations.
		// 	2-Determine each period's deviation (close less average price).
		// 	3-Square each period's deviation.
		// 	4-Sum the squared deviations.
		// 	5-Divide this sum by the number of observations.
		// 	6-The standard deviation is then equal to the square root of that number.
       
        var sumDeviations=0;
    	for(var j=0;j<bbandsOptions.period && index>=0;j++)
     	{
            var price=getPrice(data,index,bbandsOptions,type);
            //calculate the deviations of each data point from the mean, and square the result of each
     		var deviation =Math.pow(price-average,2);
			sumDeviations+=deviation;
     		--index;
	    }

        return Math.sqrt(sumDeviations/j);
	}
	//*************************End Standard Deviation********************

	//*************************SMA***************************************
	function calculateSMAValue(data,smaData,index,bbandsOptions,type)
	{
		var smaValue=null;
		if (index >= 1) 
		{
           var price = getPrice(data,index,bbandsOptions,type);
           //Calculate SMA - start
           smaValue = indicatorBase.toFixed(((smaData[index - 1].y || smaData[index - 1][1]) * (bbandsOptions.period - 1) + price) / bbandsOptions.period, 4);
           //Calculate SMA - end
        }
        return smaValue;
	}

    function calculateSMAData(data,bbandsOptions,type)
    {
        var smaData = [], sum = 0.0;
        for (var index = 0; index < bbandsOptions.period; index++)
        {
            sum+=getPrice(data,index,bbandsOptions,type);
            if (index == (bbandsOptions.period - 1))
            {
                smaData.push([data[bbandsOptions.period - 1].x ? data[bbandsOptions.period - 1].x : data[bbandsOptions.period - 1][0], sum / bbandsOptions.period]);
            }
            else
            {
                smaData.push([data[index].x ? data[index].x : data[index][0], null]);
            }
        }
        for (var index = bbandsOptions.period; index < data.length; index++)
        {
            var smaValue=calculateSMAValue(data,smaData,index,bbandsOptions,type)
            smaData.push([(data[index].x || data[index][0]), smaValue]);
        }
        return smaData;
    }
    //*************************End SMA***********************************

	//*************************EMA***************************************
	function calculateEMAValue(data,emaData,index,bbandsOptions,type)
	{
		var price =getPrice(data,index,bbandsOptions,type);
        //Calculate EMA - start
       	//ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
       	return (price * 2 / (bbandsOptions.period + 1)) + ((emaData[index - 1][1] || emaData[index - 1].y) * (1 - 2 / (bbandsOptions.period + 1)))
    }

    function calculateEMAData(data,bbandsOptions,type)
    {
        var emaData = [], sum = 0.0;
        for (var index = 0; index < bbandsOptions.period; index++) {
        	sum+=getPrice(data,index,bbandsOptions,type);
        
            if (index == (bbandsOptions.period - 1)) {
                emaData.push([data[bbandsOptions.period - 1].x ? data[bbandsOptions.period - 1].x : data[bbandsOptions.period - 1][0], sum / bbandsOptions.period]);
            }
             else {
                emaData.push([data[index].x ? data[index].x : data[index][0], null]);
            }
        }

        for (var index = bbandsOptions.period; index < data.length; index++) 
        {
       		var emaValue = calculateEMAValue(data,emaData,index,bbandsOptions,type);
       		emaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(emaValue, 4)]);
            //Calculate EMA - end
		}
		return emaData;
	}
    //*************************End EMA**************************************

    //*************************TEMA*****************************************
    function calculateTEMAValue(data,period) 
    {
        var temaData = [], sum = 0.0;
        for (var index = 0; index < period; index++) {
            sum += data[index][1];
            if (index == (period - 1)) {
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

	function calculateTEMAData(data,bbandsOptions,type,uniqueID)
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
	    	var price=getPrice(data,index,bbandsOptions,type);
	        inputData.push([data[index].x ? data[index].x : data[index][0], price]);
	    }
	    var ema1Data = calculateTEMAValue(inputData,bbandsOptions.period);
		var ema2Data = calculateTEMAValue(ema1Data,bbandsOptions.period);
	    var ema3Data = calculateTEMAValue(ema2Data,bbandsOptions.period);
	    var temaData = [];
	    for (var index = 0; index < ema3Data.length; index++) {
	        var temaVal = 3 * ema1Data[index][1] - 3 * ema2Data[index][1] + ema3Data[index][1];
	        temaData.push([ema3Data[index][0], indicatorBase.toFixed(temaVal, 4)]);
	    }      
	    ema1[uniqueID] = ema1Data;
        ema2[uniqueID] = ema2Data;
        ema3[uniqueID] = ema3Data;

        return temaData;
	}

	function calculateTEMAValueForUpdate(data,index,bbandsOptions,type,key,isPointUpdate)
	{
		var price=getPrice(data,index,bbandsOptions,type);
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
    //*************************End TEMA*************************************
	
	//*************************WMA******************************************
    function calculateWMAValue(data,bbandsOptions,index, type)
    {
        var wmaValue = 0;
        for (var subIndex = index, count = bbandsOptions.period; subIndex >= 0 && count >= 0; count--, subIndex--) {
            var price =getPrice(data,subIndex,bbandsOptions,type);
            wmaValue += price * count;
        }
        return wmaValue / (bbandsOptions.period * (bbandsOptions.period + 1) / 2);
    }
	
	function calculateWMAData(data,bbandsOptions,type)
	{
	    //Calculate WMA data
        /*
        WMA = ( Price * n + Price(1) * n-1 + ... Price( n-1 ) * 1) / ( n * ( n + 1 ) / 2 )
        Where: n = time period
        *
        *  Do not fill any value in wmaData from 0 index to options.period-1 index
        */
        var wmaData = [];
        for (var index = 0; index < bbandsOptions.period; index++)
        {
            wmaData.push([data[bbandsOptions.period - 1].x ? data[bbandsOptions.period - 1].x : data[bbandsOptions.period - 1][0], null]);
        }

        for (var index = bbandsOptions.period; index < data.length; index++) 
        {
            //Calculate WMA - start
            var wmaValue = calculateWMAValue(data, bbandsOptions,index ,type);
            wmaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(wmaValue, 4)]);
            //Calculate WMA - end
        }
        return wmaData;
	}
    //*************************End WMA***************************************

    //*************************TRIMA************************************
    function calculateTRIMAValue(data,trimaData,index,bbandsOptions,type,Nm)
	{
	    var price=getPrice(data,index,bbandsOptions,type);
        return(trimaData[index - 1][1] * (Nm - 1) + price) / Nm;
	}
	
	function calculateTRIMAData(data,bbandsOptions,type)
	{
        var trimaData = [], sum = 0.0, N = bbandsOptions.period + 1,
        Nm = Math.round( N / 2 );
        for (var index = 0; index < Nm; index++)
        {
            if (indicatorBase.isOHLCorCandlestick(type))
            {
                sum += indicatorBase.extractPriceForAppliedTO(bbandsOptions.appliedTo, data, index);
            }
            else
            {
                sum += indicatorBase.extractPrice(data, index);
            }
            if (index == (Nm - 1))
            {
                trimaData.push([data[Nm - 1].x ? data[Nm - 1].x : data[Nm - 1][0], sum / Nm]);
            }
            else
            {
                trimaData.push([data[index].x ? data[index].x : data[index][0], null]);
            }
        }

        for (var index = Nm; index < data.length; index++)
        {
            var trimaValue=calculateTRIMAValue(data,trimaData,index,bbandsOptions,type,Nm);
            trimaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(trimaValue , 4)]);
        }
        return trimaData;
	}
	//*************************End TRIMA************************************

    function calculateMAValue(data,maData,index,bbandsOptions,type,key,isPointUpdate)
    {
     var maValue=null;
     switch(bbandsOptions.maType) {
	     case "SMA":
	        maValue=calculateSMAValue(data,maData,index,bbandsOptions,type);
	        break;
	     case "EMA":
	        maValue=calculateEMAValue(data,maData,index,bbandsOptions,type);
	        break;
	     case "WMA":
	        maValue=calculateWMAValue(data,bbandsOptions,index,type);
	        break;
	     case "TEMA":
	        maValue=calculateTEMAValueForUpdate(data,index,bbandsOptions,type,key,isPointUpdate);
	        break;
	     case "TRIMA":
	        var  Nm = Math.round( (bbandsOptions.period + 1) / 2 );
	        maValue= calculateTRIMAValue(data,maData,index,bbandsOptions,type,Nm);
	        break;
	    }
	    return maValue;
	}

    function calculateMiddleBand(data,bbandsOptions,type,uniqueID)
    {
     var bbandsMdlBndData=[];
     switch(bbandsOptions.maType) {
	     case "SMA":
	        bbandsMdlBndData=calculateSMAData(data,bbandsOptions,type);
	        break;
	     case "EMA":
	         bbandsMdlBndData=calculateEMAData(data,bbandsOptions,type);
	        break;
	     case "WMA":
	        bbandsMdlBndData=calculateWMAData(data,bbandsOptions,type);
	        break;
	     case "TEMA":
	        bbandsMdlBndData=calculateTEMAData(data,bbandsOptions,type,uniqueID);
	        break;
	     case "TRIMA":
	        bbandsMdlBndData=calculateTRIMAData(data,bbandsOptions,type);
	        break;
	    }
	    return bbandsMdlBndData;
	}

    function calculateLowerBand(data,bbandsMddlBndData,bbandsOptions,type)
    {
    	var bbandsLwrBndData=[];
    	for (var index = 0; index < data.length; index++)
        {
        	//Calculate Lower Band - start
        	var ma=bbandsMddlBndData[index][1];
  	    	var standardDeviation=calculateStandardDeviation(data,index,bbandsOptions,type,ma);
    	    //Lower Band = 20-day SMA - (20-day standard deviation of price x 2)
    	    var lwrBndVal=ma-(standardDeviation*bbandsOptions.devDn);
    	    //Calculate Lower Band - End                    
            bbandsLwrBndData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(lwrBndVal, 4)]);
        }
 		 return bbandsLwrBndData;    
    }

    function calculateUperBand(data,bbandsMddlBndData,bbandsOptions,type)
    {
    	var bbandsUprBandData=[];
    	for (var index = 0; index < data.length; index++)
        {
        	//Calculate Uper Band - start
            var ma=bbandsMddlBndData[index][1];
  	    	var standardDeviation=calculateStandardDeviation(data,index,bbandsOptions,type,ma);
    		//Uper Band = 20-day SMA + (20-day standard deviation of price x 2)
    	    var UprBndVal=ma+(standardDeviation*bbandsOptions.devDn);
    	    //Calculate Uper Band - End
            bbandsUprBandData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(UprBndVal, 4)]);
        }
        return bbandsUprBandData;
    }

    return {
    	init:function(){
    		  (function(H,$,indicatorBase) {
    		  	if (!H || H.Series.prototype.addBBANDS) return;

                H.Series.prototype.addBBANDS = function ( bbandsOptions ) {
                    var seriesID = this.options.id;
                    bbandsOptions = $.extend({
                        period: 20,
                        devUp:2,
                        devDn:2,
                        maType:"SMA",
                        mdlBndStroke: 'red',
                        uprBndStroke:'#A52A2A',
                        lwrBndStroke:'#A52A2A',
                        strokeWidth: 1,
                        dashStyle: 'line',
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID: seriesID
                    }, bbandsOptions);

                    var uniqueID      =  Date.now();
                    var mdlUniqueID   = "m-" + uniqueID;
                    var uprUniqueID   = "u-" + uniqueID;
                    var lwrUniqueID   = "l-" + uniqueID;
                    var rangeUniqueID = "range-" + uniqueID;

                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {
                        //Calculate Bollinger Band data
                        /*
                         * Formula
                            Bollinger Bands:
                            	* Middle Band = 20-day simple moving average (SMA)
  								* Upper Band = 20-day SMA + (20-day standard deviation of price x 2) 
  								* Lower Band = 20-day SMA - (20-day standard deviation of price x ss)
  							SMA:
  								* N period sum / N
                         */
                        //* Middle Band Data
                        var bbandsMiddleBandData = calculateMiddleBand(data,bbandsOptions,this.options.type,mdlUniqueID);
                        //* Upper Band Data
        				var bbandsUperBandData = calculateUperBand(data,bbandsMiddleBandData,bbandsOptions,this.options.type);
                        //* Lower Band Data
        				var bbandsLowerBandData = calculateLowerBand(data,bbandsMiddleBandData,bbandsOptions,this.options.type);

   						var chart = this.chart;
 
                        bbandsOptionsMap[mdlUniqueID] = bbandsOptions;
                        bbandsOptionsMap[uprUniqueID] = bbandsOptions;
                        bbandsOptionsMap[lwrUniqueID] = bbandsOptions;

                        //Bollinger Middle Band
                        var series = this;
                        bbandsMdlSeriesMap[mdlUniqueID] = chart.addSeries({
                            id: mdlUniqueID,
                            name: 'BBANDS (Middle,' + bbandsOptions.period +',' +bbandsOptions.devUp +','+bbandsOptions.devDn +',' + indicatorBase.appliedPriceString(bbandsOptions.appliedTo) + ')',
                            data: bbandsMiddleBandData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: bbandsOptions.mdlBndStroke,
                            lineWidth: bbandsOptions.strokeWidth,
                            dashStyle: bbandsOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //Bollinger Uper Band
                        bbandsUprSeriesMap[uprUniqueID] = chart.addSeries({
                            id: uprUniqueID,
                            name: 'BBANDS Upper',
                            data: bbandsUperBandData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: bbandsOptions.uprBndStroke,
                            lineWidth: bbandsOptions.strokeWidth,
                            dashStyle: bbandsOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);


                        //Bollinger Lower Band
                        bbandsLwrSeriesMap[lwrUniqueID] = chart.addSeries({
                            id: lwrUniqueID,
                            name: 'BBANDS Lower',
                            data: bbandsLowerBandData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: bbandsOptions.lwrBndStroke,
                            lineWidth: bbandsOptions.strokeWidth,
                            dashStyle: bbandsOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        /**
                         * Following series is just to show the colored range
                         * @type {Array}
                         */
                        var seriesAreaData = [];
                        bbandsLowerBandData.forEach(function(eachLwr, index) {
                            var data = [eachLwr[0], eachLwr[1], bbandsUperBandData[index][1]];
                            seriesAreaData.push(data);
                        });
                        chart.addSeries({
                            id: rangeUniqueID,
                            data: seriesAreaData,
                            name: "BBANDS Range",
                            type: 'arearange',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: 'white',
                            fillColor: 'rgba(28,28,28,0.5)',
                            connectNulls: true,
                            compare: series.options.compare,
                            //Following properties, states, events, dataLabels, point are needed. Otherwise higcharts-more throws error
                            states: {
                                hover: {
                                    enabled: false
                                }
                            },
                            events : {},
                            dataLabels : {
                                enabled : false
                            },
                            point: {
                                events: {}
                            },
                            enableMouseTracking: false
                        }, false, false);

                        $(bbandsMdlSeriesMap[mdlUniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'bbands',
                            isIndicator: true,
                            parentSeriesID: bbandsOptions.parentSeriesID,
                            period: bbandsOptions.period
                        });
                        $(bbandsUprSeriesMap[uprUniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'bbands',
                            isIndicator: true,
                            parentSeriesID: bbandsOptions.parentSeriesID,
                            period: bbandsOptions.period
                        });
                        $(bbandsLwrSeriesMap[lwrUniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'bbands',
                            isIndicator: true,
                            parentSeriesID: bbandsOptions.parentSeriesID,
                            period: bbandsOptions.period
                        });

                        chart.redraw();
                    }
                 };
                    
                H.Series.prototype.removeBBANDS = function (uniqueID) {
                    var chart = this.chart;
                    var datePart = uniqueID.replace("m-", "").replace('l-', "").replace('u-', '');
                    ['m', 'u', 'l', 'range'].forEach(function(eachSeriesType) {
                        var key = eachSeriesType + '-' + datePart;
                        chart.get(key).remove();
                        if (eachSeriesType !== 'range') {
                            if (bbandsOptionsMap[key].maType === "TEMA") {
                                ema1[key] = [];
                                ema2[key] = [];
                                ema3[key] = [];
                            }
                            bbandsOptionsMap[key] = null;
                            bbandsMdlSeriesMap[key] = null;
                            bbandsUprSeriesMap[key] = null;
                            bbandsLwrSeriesMap[key] = null;
                        }
                    });
                    chart.redraw();
                };

                H.Series.prototype.preRemovalCheckBBANDS = function(uniqueID) {
                    var indicatorName = undefined;
                    if (bbandsOptionsMap[uniqueID]) {
                        indicatorName = 'BBANDS (' + bbandsOptionsMap[uniqueID].period + ',' +bbandsOptionsMap[uniqueID].devUp + ',' + bbandsOptionsMap[uniqueID].devDn +',' + indicatorBase.appliedPriceString(bbandsOptionsMap[uniqueID].appliedTo) + ')';
                    }
                  return {
                      isMainIndicator : uniqueID.indexOf("m-") === 0,
                      period : !bbandsOptionsMap[uniqueID] ? undefined : bbandsOptionsMap[uniqueID].period,
                      appliedTo : !bbandsOptionsMap[uniqueID] ? undefined : bbandsOptionsMap[uniqueID].appliedTo,
                      devUp: !bbandsOptionsMap[uniqueID] ? undefined : bbandsOptionsMap[uniqueID].devUp,
                      devDn: !bbandsOptionsMap[uniqueID] ? undefined : bbandsOptionsMap[uniqueID].devDn,
                      maType: !bbandsOptionsMap[uniqueID] ? undefined : bbandsOptionsMap[uniqueID].maType,
                      isValidUniqueID : bbandsOptionsMap[uniqueID] != null,
                      indicatorName : indicatorName
                  };
                };

                H.wrap(H.Series.prototype, 'addPoint', function(pbllngbndseed, options, redraw, shift, animation) {
                    pbllngbndseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(bbandsOptionsMap, this.options.id)) {
                        updateBBANDSMDLBNDSeries.call(this, options[0]);
                        updateBBANDSUPRBNDSeries.call(this, options[0]);
                        updateBBANDSLWRBNDSeries.call(this, options[0]);
                        updateBBANDS_range.call(this, options[0]);
                    }
                });

                H.wrap(H.Point.prototype, 'update', function(pbllngbndseed, options, redraw, animation) {
                    pbllngbndseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(bbandsOptionsMap, this.series.options.id)) {
                        console.log('BBANDS : Updating BB values for main series ID : ', this.series.options.id);
                        updateBBANDSMDLBNDSeries.call(this.series, this.x, true);
                        updateBBANDSUPRBNDSeries.call(this.series, this.x, true);
                        updateBBANDSLWRBNDSeries.call(this.series, this.x, true);
                        updateBBANDS_range.call(this.series, this.x, true);
                    }
                });

 				function updateBBANDSMDLBNDSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new data point
                    for (var key in bbandsMdlSeriesMap) {
                        if (bbandsMdlSeriesMap[key] && bbandsMdlSeriesMap[key].options && bbandsMdlSeriesMap[key].options.data && bbandsMdlSeriesMap[key].options.data.length > 0
                            && bbandsOptionsMap[key].parentSeriesID == series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var maData = bbandsMdlSeriesMap[key].options.data;
                            var bbandsOptions=bbandsOptionsMap[key];
                            var middleBandData = bbandsMdlSeriesMap[key].options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var maValue = calculateMAValue(data,maData,dataPointIndex,bbandsOptions,this.options.type,key,isPointUpdate && bbandsMdlSeriesMap[key].options.data.length >= data.length)
                                if (isPointUpdate)
                                {
                                	bbandsMdlSeriesMap[key].data[dataPointIndex].update({ y : indicatorBase.toFixed(maValue,4)});
                                }
                                else
                                {
                                    bbandsMdlSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(maValue,4)], true, true, false);
                                }
                            }
                        }
                    }
				}

				function updateBBANDSUPRBNDSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new  data point
                    for (var key in bbandsUprSeriesMap) {
                        if (bbandsUprSeriesMap[key] && bbandsUprSeriesMap[key].options && bbandsUprSeriesMap[key].options.data && bbandsUprSeriesMap[key].options.data.length > 0
                            && bbandsOptionsMap[key].parentSeriesID == series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var upperBandData = bbandsUprSeriesMap[key].options.data;
                            var mdlKey=key.replace('u','m');
                            var maData = bbandsMdlSeriesMap[mdlKey].options.data;
                            var bbandsOptions=bbandsOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate Upper Band - start
					        	 var ma = maData[dataPointIndex][1] || maData[dataPointIndex].y;
					  	    	 var standardDeviation = calculateStandardDeviation(data,dataPointIndex,bbandsOptions,this.options.type,ma);
					    		 //Upper Band = 20-day SMA + (20-day standard deviation of price x 2)
					    	     var uprBndVal = ma + (standardDeviation * bbandsOptions.devDn);
                                console.log('uprBndVal', uprBndVal, 'ma', ma, 'standardDeviation', standardDeviation, 'bbandsOptions.devDn', bbandsOptions.devDn);
					            //Calculate Upper Band - End
					            if (isPointUpdate)
                                {
                                	bbandsUprSeriesMap[key].data[dataPointIndex].update({ y : indicatorBase.toFixed(uprBndVal,4)});
                                }
                                else
                                {
                                    bbandsUprSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(uprBndVal,4)], true, true, false);
                                }
                            }
                        }
                    }
				}

				function updateBBANDSLWRBNDSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new  data point
                    for (var key in bbandsLwrSeriesMap) {
                        if (bbandsLwrSeriesMap[key] && bbandsLwrSeriesMap[key].options && bbandsLwrSeriesMap[key].options.data && bbandsLwrSeriesMap[key].options.data.length > 0
                            && bbandsOptionsMap[key].parentSeriesID == series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var upperBandData = bbandsLwrSeriesMap[key].options.data;
                            var mdlKey=key.replace('l','m');
                            var maData = bbandsMdlSeriesMap[mdlKey].options.data;
                            var bbandsOptions=bbandsOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                //Calculate Lower Band - start
					        	 var ma = maData[dataPointIndex][1] || maData[dataPointIndex].y;
					  	    	 var standardDeviation=calculateStandardDeviation(data,dataPointIndex,bbandsOptions,this.options.type,ma);
					    		 //Lower Band = 20-day SMA + (20-day standard deviation of price x 2)
					    	     var lwrBndVal=ma - (standardDeviation*bbandsOptions.devDn);
					            //Calculate Lower Band - End
					            if (isPointUpdate && bbandsLwrSeriesMap[key].options.data.length >= data.length)
                                {
                                	bbandsLwrSeriesMap[key].data[dataPointIndex].update({ y : indicatorBase.toFixed(lwrBndVal,4)});
                                }
                                else
                                {
                                    bbandsLwrSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(lwrBndVal,4)], true, true, false);
                                }
                            }
                        }
                    }
				}

                function updateBBANDS_range(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new  data point
                    for (var key in bbandsUprSeriesMap) {
                        if (bbandsUprSeriesMap[key] && bbandsUprSeriesMap[key].options && bbandsUprSeriesMap[key].options.data && bbandsUprSeriesMap[key].options.data.length > 0
                            && bbandsOptionsMap[key].parentSeriesID == series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var upperBandData = bbandsUprSeriesMap[key].options.data;
                            var lowerBandData = bbandsLwrSeriesMap[key.replace('u', 'l')].options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            var updatePointInTime = data[dataPointIndex].x || data[dataPointIndex][0];
                            var lowerValue = lowerBandData[dataPointIndex].y || lowerBandData[dataPointIndex][1];
                            var upperValue = upperBandData[dataPointIndex].y || upperBandData[dataPointIndex][1];
                            var value = [updatePointInTime, lowerValue, upperValue];
                            if (dataPointIndex >= 1) {
                                chart.series.forEach(function(eachSeries) {
                                    if (eachSeries.options.id === ('range' + key.replace('u', ''))) {
                                        //Calculate Upper Band - End
                                        if (isPointUpdate) {
                                            eachSeries.data[dataPointIndex].update(value);
                                        } else {
                                            eachSeries.addPoint(value, true, true, false);
                                        }
                                        return false;
                                    }
                                });
                            }
                            console.log('BBAND series range : ', updatePointInTime,
                                lowerBandData[lowerBandData.length - 1].x || lowerBandData[lowerBandData.length - 1][0],
                                upperBandData[upperBandData.length - 1].x || upperBandData[upperBandData.length - 1][0]);
                        }
                    }
                }

    		  })(Highcharts, jQuery,indicatorBase);
    	}
    }
});
