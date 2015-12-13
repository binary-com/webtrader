/*
Created by Mahboob.M on 26.11.2015
*/
define(['indicator_base', 'highstock'],function(indicatorBase){

	var bllngrbndOptionsMap = {}, 
	 bllngrbndMdlSeriesMap = {},
	 bllngrbndUprSeriesMap = {},
	 bllngrbndLwrSeriesMap = {};
    var  ema1 = {}, ema2 = {}, ema3 = {};

    //******************************Get Price*************************
    function getPrice(data,index,bllngrbndOptions,type)
    {
    	var price = 0.0;
        if (indicatorBase.isOHLCorCandlestick(type)) {
            price = indicatorBase.extractPriceForAppliedTO(bllngrbndOptions.appliedTo, data, index);
        }
        else {
            price = indicatorBase.extractPrice(data, index); 
        }
        return price;
    }
    
    //*************************Standard Deviation**********************
    function calculateStandardDeviation(data,index,bllngrbndOptions,type,average)
    {
    	// Standard Dviation :
  		// 	1-Calculate the average (mean) price for the number of periods or observations.
		// 	2-Determine each period's deviation (close less average price).
		// 	3-Square each period's deviation.
		// 	4-Sum the squared deviations.
		// 	5-Divide this sum by the number of observations.
		// 	6-The standard deviation is then equal to the square root of that number.
       
        var sumDeviations=0;
    	for(var j=0;j<bllngrbndOptions.period && index>=0;j++)
     	{
            var price=getPrice(data,index,bllngrbndOptions,type);
            //calculate the deviations of each data point from the mean, and square the result of each
     		var deviation =Math.pow(price-average,2);
			sumDeviations+=deviation;
     		--index;
	    }

        return Math.sqrt(sumDeviations/j);
	}
	//*************************End Standard Deviation********************

	//*************************SMA***************************************
	function calculateSMAValue(data,smaData,index,bllngrbndOptions,type)
	{
		var smaValue=null;
		if (index >= 1) 
		{
           var price = getPrice(data,index,bllngrbndOptions,type);
           //Calculate SMA - start
           smaValue = indicatorBase.toFixed(((smaData[index - 1].y || smaData[index - 1][1]) * (bllngrbndOptions.period - 1) + price) / bllngrbndOptions.period, 4);
           //Calculate SMA - end
        }
        return smaValue;
	}

    function calculateSMAData(data,bllngrbndOptions,type)
    {
        var smaData = [], sum = 0.0;
        for (var index = 0; index < bllngrbndOptions.period; index++)
        {
            sum+=getPrice(data,index,bllngrbndOptions,type);
            if (index == (bllngrbndOptions.period - 1))
            {
                smaData.push([data[bllngrbndOptions.period - 1].x ? data[bllngrbndOptions.period - 1].x : data[bllngrbndOptions.period - 1][0], sum / bllngrbndOptions.period]);
            }
            else
            {
                smaData.push([data[index].x ? data[index].x : data[index][0], null]);
            }
        }
        for (var index = bllngrbndOptions.period; index < data.length; index++)
        {
            var smaValue=calculateSMAValue(data,smaData,index,bllngrbndOptions,type)
            smaData.push([(data[index].x || data[index][0]), smaValue]);
        }
        return smaData;
    }
    //*************************End SMA***********************************

	//*************************EMA***************************************
	function calculateEMAValue(data,emaData,index,bllngrbndOptions,type)
	{
		var price =getPrice(data,index,bllngrbndOptions,type);
        //Calculate EMA - start
       	//ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
       	return (price * 2 / (bllngrbndOptions.period + 1)) + ((emaData[index - 1][1] || emaData[index - 1].y) * (1 - 2 / (bllngrbndOptions.period + 1)))
    }

    function calculateEMAData(data,bllngrbndOptions,type)
    {
        var emaData = [], sum = 0.0;
        for (var index = 0; index < bllngrbndOptions.period; index++) {
        	sum+=getPrice(data,index,bllngrbndOptions,type);
        
            if (index == (bllngrbndOptions.period - 1)) {
                emaData.push([data[bllngrbndOptions.period - 1].x ? data[bllngrbndOptions.period - 1].x : data[bllngrbndOptions.period - 1][0], sum / bllngrbndOptions.period]);
            }
             else {
                emaData.push([data[index].x ? data[index].x : data[index][0], null]);
            }
        }

        for (var index = bllngrbndOptions.period; index < data.length; index++) 
        {
       		var emaValue = calculateEMAValue(data,emaData,index,bllngrbndOptions,type);
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

	function calculateTEMAData(data,bllngrbndOptions,type,uniqueID)
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
	    	var price=getPrice(data,index,bllngrbndOptions,type);
	        inputData.push([data[index].x ? data[index].x : data[index][0], price]);
	    }
	    var ema1Data = calculateTEMAValue(inputData,bllngrbndOptions.period);
		var ema2Data = calculateTEMAValue(ema1Data,bllngrbndOptions.period);
	    var ema3Data = calculateTEMAValue(ema2Data,bllngrbndOptions.period);
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

	function calculateTEMAValueForUpdate(data,index,bllngrbndOptions,type,key,isPointUpdate)
	{
		var price=getPrice(data,index,bllngrbndOptions,type);
		var n = bllngrbndOptions.period;
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
    function calculateWMAValue(data,bllngrbndOptions,index, type)
    {
        var wmaValue = 0;
        for (var subIndex = index, count = bllngrbndOptions.period; subIndex >= 0 && count >= 0; count--, subIndex--) {
            var price =getPrice(data,subIndex,bllngrbndOptions,type);
            wmaValue += price * count;
        }
        return wmaValue / (bllngrbndOptions.period * (bllngrbndOptions.period + 1) / 2);
    }
	
	function calculateWMAData(data,bllngrbndOptions,type)
	{
	    //Calculate WMA data
        /*
        WMA = ( Price * n + Price(1) * n-1 + ... Price( n-1 ) * 1) / ( n * ( n + 1 ) / 2 )
        Where: n = time period
        *
        *  Do not fill any value in wmaData from 0 index to options.period-1 index
        */
        var wmaData = [];
        for (var index = 0; index < bllngrbndOptions.period; index++)
        {
            wmaData.push([data[bllngrbndOptions.period - 1].x ? data[bllngrbndOptions.period - 1].x : data[bllngrbndOptions.period - 1][0], null]);
        }

        for (var index = bllngrbndOptions.period; index < data.length; index++) 
        {
            //Calculate WMA - start
            var wmaValue = calculateWMAValue(data, bllngrbndOptions,index ,type);
            wmaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(wmaValue, 4)]);
            //Calculate WMA - end
        }
        return wmaData;
	}
    //*************************End WMA***************************************

    //*************************TRIMA************************************
    function calculateTRIMAValue(data,trimaData,index,bllngrbndOptions,type,Nm)
	{
	    var price=getPrice(data,index,bllngrbndOptions,type);
        return(trimaData[index - 1][1] * (Nm - 1) + price) / Nm;
	}
	
	function calculateTRIMAData(data,bllngrbndOptions,type)
	{
        var trimaData = [], sum = 0.0, N = bllngrbndOptions.period + 1,
        Nm = Math.round( N / 2 );
        for (var index = 0; index < Nm; index++)
        {
            if (indicatorBase.isOHLCorCandlestick(type))
            {
                sum += indicatorBase.extractPriceForAppliedTO(bllngrbndOptions.appliedTo, data, index);
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
            var trimaValue=calculateTRIMAValue(data,trimaData,index,bllngrbndOptions,type,Nm);
            trimaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(trimaValue , 4)]);
        }
        return trimaData;
	}
	//*************************End TRIMA************************************

    function calculateMAValue(data,maData,index,bllngrbndOptions,type,key,isPointUpdate)
    {
     var maValue=null;
     switch(bllngrbndOptions.maType) {
	     case "SMA":
	        maValue=calculateSMAValue(data,maData,index,bllngrbndOptions,type);
	        break;
	     case "EMA":
	        maValue=calculateEMAValue(data,maData,index,bllngrbndOptions,type);
	        break;
	     case "WMA":
	        maValue=calculateWMAValue(data,bllngrbndOptions,index,type);
	        break;
	     case "TEMA":
	        maValue=calculateTEMAValueForUpdate(data,index,bllngrbndOptions,type,key,isPointUpdate);
	        break;
	     case "TRIMA":
	        var  Nm = Math.round( (bllngrbndOptions.period + 1) / 2 );
	        maValue= calculateTRIMAValue(data,maData,index,bllngrbndOptions,type,Nm);
	        break;
	    }
	    return maValue;
	}

    function calculateMiddleBand(data,bllngrbndOptions,type,uniqueID)
    {
     var bllngrMdlBndData=[];
     switch(bllngrbndOptions.maType) {
	     case "SMA":
	        bllngrMdlBndData=calculateSMAData(data,bllngrbndOptions,type);
	        break;
	     case "EMA":
	         bllngrMdlBndData=calculateEMAData(data,bllngrbndOptions,type);
	        break;
	     case "WMA":
	        bllngrMdlBndData=calculateWMAData(data,bllngrbndOptions,type);
	        break;
	     case "TEMA":
	        bllngrMdlBndData=calculateTEMAData(data,bllngrbndOptions,type,uniqueID);
	        break;
	     case "TRIMA":
	        bllngrMdlBndData=calculateTRIMAData(data,bllngrbndOptions,type);
	        break;
	    }
	    return bllngrMdlBndData;
	}

    function calculateLowerBand(data,bllngrMddlBndData,bllngrbndOptions,type)
    {
    	var bllngrLwrBndData=[];
    	for (var index = 0; index < data.length; index++)
        {
        	//Calculate Lower Band - start
        	var ma=bllngrMddlBndData[index][1];
  	    	var standardDeviation=calculateStandardDeviation(data,index,bllngrbndOptions,type,ma);
    	    //Lower Band = 20-day SMA - (20-day standard deviation of price x 2)
    	    var lwrBndVal=ma-(standardDeviation*bllngrbndOptions.devDn);
    	    //Calculate Lower Band - End                    
            bllngrLwrBndData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(lwrBndVal, 4)]);
        }
 		 return bllngrLwrBndData;    
    }

    function calculateUperBand(data,bllngrMddlBndData,bllngrbndOptions,type)
    {
    	var bllngrUprBandData=[];
    	for (var index = 0; index < data.length; index++)
        {
        	//Calculate Uper Band - start
            var ma=bllngrMddlBndData[index][1];
  	    	var standardDeviation=calculateStandardDeviation(data,index,bllngrbndOptions,type,ma);
    		//Uper Band = 20-day SMA + (20-day standard deviation of price x 2)
    	    var UprBndVal=ma+(standardDeviation*bllngrbndOptions.devDn);
    	    //Calculate Uper Band - End
            bllngrUprBandData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(UprBndVal, 4)]);
        }
        return bllngrUprBandData;
    }

    return {
    	init:function(){
    		  (function(H,$,indicatorBase) {
    		  	if (!H || H.Series.prototype.addBLLNGRBND) return;

                H.Series.prototype.addBLLNGRBND = function ( bllngrbndOptions ) {
                    var seriesID = this.options.id;
                    bllngrbndOptions = $.extend({
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
                    }, bllngrbndOptions);

                    var uniqueID =  new Date().getTime();
                    var mdlUniqueID="m-"+uniqueID;
                    var uprUniqueID="u-"+uniqueID;
                    var lwrUniqueID="l-"+uniqueID;

                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {
                        //Calculate Bollinger Band data
                        /*
                         * Formula
                            Bollinger Band:
                            	* Middle Band = 20-day simple moving average (SMA)
  								* Upper Band = 20-day SMA + (20-day standard deviation of price x 2) 
  								* Lower Band = 20-day SMA - (20-day standard deviation of price x ss)
  							SMA:
  								* N period sum / N
                         */
                        //* Middle Band Data
                        var bllngrMiddleBandData=calculateMiddleBand(data,bllngrbndOptions,this.options.type,mdlUniqueID);
                        //* Upper Band Data
        				var bllngrUperBandData=calculateUperBand(data,bllngrMiddleBandData,bllngrbndOptions,this.options.type);
                        //* Lower Band Data
        				var bllngrLowerBandData=calculateLowerBand(data,bllngrMiddleBandData,bllngrbndOptions,this.options.type);

   						var chart = this.chart;
 
                        bllngrbndOptionsMap[mdlUniqueID] = bllngrbndOptions;
                        bllngrbndOptionsMap[uprUniqueID] = bllngrbndOptions;
                        bllngrbndOptionsMap[lwrUniqueID] = bllngrbndOptions;

                        //Bollinger Middle Band
                        var series = this;
                        bllngrbndMdlSeriesMap[mdlUniqueID] = chart.addSeries({
                            id: mdlUniqueID,
                            name: 'BLLNGRBND(MDDLBND ' + bllngrbndOptions.period +',' +bllngrbndOptions.devUp +','+bllngrbndOptions.devDn +',' + indicatorBase.appliedPriceString(bllngrbndOptions.appliedTo) + ')',
                            data: bllngrMiddleBandData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: bllngrbndOptions.mdlBndStroke,
                            lineWidth: bllngrbndOptions.strokeWidth,
                            dashStyle: bllngrbndOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //Bollinger Uper Band
                        var series = this;
                        bllngrbndUprSeriesMap[uprUniqueID] = chart.addSeries({
                            id: uprUniqueID,
                            name: 'BLLNGRBND(UPRBND ' + bllngrbndOptions.period +',' +bllngrbndOptions.devUp +','+bllngrbndOptions.devDn +',' + indicatorBase.appliedPriceString(bllngrbndOptions.appliedTo) + ')',
                            data: bllngrUperBandData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: bllngrbndOptions.uprBndStroke,
                            lineWidth: bllngrbndOptions.strokeWidth,
                            dashStyle: bllngrbndOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);


                        //Bollinger Lower Band
                        var series = this;
                        bllngrbndLwrSeriesMap[lwrUniqueID] = chart.addSeries({
                            id: lwrUniqueID,
                            name: 'BLLNGRBND(LWRBND ' + bllngrbndOptions.period +',' +bllngrbndOptions.devUp +','+bllngrbndOptions.devDn +',' + indicatorBase.appliedPriceString(bllngrbndOptions.appliedTo) + ')',
                            data: bllngrLowerBandData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: bllngrbndOptions.lwrBndStroke,
                            lineWidth: bllngrbndOptions.strokeWidth,
                            dashStyle: bllngrbndOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        $(bllngrbndMdlSeriesMap[mdlUniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'bllngrbnd',
                            isIndicator: true,
                            parentSeriesID: bllngrbndOptions.parentSeriesID,
                            period: bllngrbndOptions.period
                        });
                          $(bllngrbndUprSeriesMap[uprUniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'bllngrbnd',
                            isIndicator: true,
                            parentSeriesID: bllngrbndOptions.parentSeriesID,
                            period: bllngrbndOptions.period
                        });
                            $(bllngrbndLwrSeriesMap[lwrUniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'bllngrbnd',
                            isIndicator: true,
                            parentSeriesID: bllngrbndOptions.parentSeriesID,
                            period: bllngrbndOptions.period
                        });

                        chart.redraw();
                    }
                 };
                    

                H.Series.prototype.removeBLLNGRBND = function (uniqueID) {
                    var chart = this.chart;
                    if(bllngrbndOptionsMap[uniqueID].maType=="TEMA")
                    {
                    	ema1[uniqueID] = [];
                   		ema2[uniqueID] = [];
                   		ema3[uniqueID] = [];
                    }
                    bllngrbndOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    bllngrbndMdlSeriesMap[uniqueID] = null;
                    bllngrbndUprSeriesMap[uniqueID] = null;
                    bllngrbndLwrSeriesMap[uniqueID] = null;
                    chart.redraw();
                }

                H.wrap(H.Series.prototype, 'addPoint', function(pbllngbndseed, options, redraw, shift, animation) {
                    pbllngbndseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(bllngrbndOptionsMap, this.options.id)) {
                        updateBLLNGRMDLBNDSeries.call(this, options);
                        updateBLLNGRUPRBNDSeries.call(this, options);
                        updateBLLNGRLWRBNDSeries.call(this, options);
                    }
                });

                H.wrap(H.Point.prototype, 'update', function(pbllngbndseed, options, redraw, animation) {
                    pbllngbndseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(bllngrbndOptionsMap, this.series.options.id)) {
                        updateBLLNGRMDLBNDSeries.call(this.series, options, true);
                        updateBLLNGRUPRBNDSeries.call(this.series, options, true);
                        updateBLLNGRLWRBNDSeries.call(this.series, options, true);
                    }
                });

 				function updateBLLNGRMDLBNDSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new data point
                    for (var key in bllngrbndMdlSeriesMap) {
                        if (bllngrbndMdlSeriesMap[key] && bllngrbndMdlSeriesMap[key].options && bllngrbndMdlSeriesMap[key].options.data && bllngrbndMdlSeriesMap[key].options.data.length > 0
                            && bllngrbndOptionsMap[key].parentSeriesID == series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var maData = bllngrbndMdlSeriesMap[key].options.data;
                            var bllngrbndOptions=bllngrbndOptionsMap[key];
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                var maValue = calculateMAValue(data,maData,dataPointIndex,bllngrbndOptions,this.options.type,key,isPointUpdate && bllngrbndMdlSeriesMap[key].options.data.length >= data.length)
                                if (isPointUpdate && bllngrbndMdlSeriesMap[key].options.data.length >= data.length)
                                {
                                	bllngrbndMdlSeriesMap[key].data[dataPointIndex].update([(data[dataPointIndex].x || data[dataPointIndex][0]),indicatorBase.toFixed(maValue,4)]);
                                }
                                else
                                {
                                    bllngrbndMdlSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(maValue,4)]);
                                }
                            }
                        }
                    }
				}

				function updateBLLNGRUPRBNDSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new  data point
                    for (var key in bllngrbndUprSeriesMap) {
                        if (bllngrbndUprSeriesMap[key] && bllngrbndUprSeriesMap[key].options && bllngrbndUprSeriesMap[key].options.data && bllngrbndUprSeriesMap[key].options.data.length > 0
                            && bllngrbndOptionsMap[key].parentSeriesID == series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var upperBandData = bllngrbndUprSeriesMap[key].options.data;
                            var mdlKey=key.replace('u','m');
                            var maData = bllngrbndMdlSeriesMap[mdlKey].options.data;
                            var bllngrbndOptions=bllngrbndOptionsMap[key];
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate Uper Band - start
					        	 var ma=maData[dataPointIndex][1];
					  	    	 var standardDeviation=calculateStandardDeviation(data,dataPointIndex,bllngrbndOptions,this.options.type,ma);
					    		 //Uper Band = 20-day SMA + (20-day standard deviation of price x 2)
					    	     var uprBndVal=ma+(standardDeviation*bllngrbndOptions.devDn);
					            //Calculate Uper Band - End
					            if (isPointUpdate && bllngrbndUprSeriesMap[key].options.data.length >= data.length)
                                {
                                	bllngrbndUprSeriesMap[key].data[dataPointIndex].update([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(uprBndVal,4)]);
                                }
                                else
                                {
                                    bllngrbndUprSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), , indicatorBase.toFixed(uprBndVal,4)]);
                                }
                            }
                        }
                    }
				}

				function updateBLLNGRLWRBNDSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new  data point
                    for (var key in bllngrbndLwrSeriesMap) {
                        if (bllngrbndLwrSeriesMap[key] && bllngrbndLwrSeriesMap[key].options && bllngrbndLwrSeriesMap[key].options.data && bllngrbndLwrSeriesMap[key].options.data.length > 0
                            && bllngrbndOptionsMap[key].parentSeriesID == series.options.id) {
                            //Find the data point
                            var data = series.options.data;
                            var upperBandData = bllngrbndLwrSeriesMap[key].options.data;
                            var mdlKey=key.replace('l','m');
                            var maData = bllngrbndMdlSeriesMap[mdlKey].options.data;
                            var bllngrbndOptions=bllngrbndOptionsMap[key];
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate Lower Band - start
					        	 var ma=maData[dataPointIndex][1];
					  	    	 var standardDeviation=calculateStandardDeviation(data,dataPointIndex,bllngrbndOptions,this.options.type,ma);
					    		 //Lower Band = 20-day SMA + (20-day standard deviation of price x 2)
					    	     var lwrBndVal=ma - (standardDeviation*bllngrbndOptions.devDn);
					            //Calculate Lower Band - End
					            if (isPointUpdate && bllngrbndLwrSeriesMap[key].options.data.length >= data.length)
                                {
                                	bllngrbndLwrSeriesMap[key].data[dataPointIndex].update([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(lwrBndVal,4)]);
                                }
                                else
                                {
                                    bllngrbndLwrSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(lwrBndVal,4)]);
                                }
                            }
                        }
                    }
				}

    		  })(Highcharts, jQuery,indicatorBase);
    	}
    }
});
