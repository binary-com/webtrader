/*
Created by Mahboob.M on 26.11.2015
*/
define(['indicator_base', 'highstock'],function(indicatorBase){

	var bllngrbndOptionsMap = {}, bllngrbndSeriesMap = {};
    function getPrice(data,index,bllngrbndOptions,type)
    {
    	var price = 0.0;
        if (indicatorBase.isOHLCorCandlestick(type)) {
            price = indicatorBase.extractPriceForAppliedTO(bllngrbndOptions.appliedTo, data, index);
        }
        else {
            price = data[index].y ? data[index].y : data[index][1];
        }
        return price;
    }

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
	
    function calculateSMA(data,bllngrbndOptions,type)
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
            var price = getPrice(data,index,bllngrbndOptions,type);
            //Calculate SMA - start
            var smaValue = (smaData[index - 1][1] * (bllngrbndOptions.period - 1) + price) / bllngrbndOptions.period;
            smaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(smaValue , 4)]);
            //Calculate SMA - end
        }
        return smaData;
    }

    function calculateEMA(data,bllngrbndOptions,type)
	{
		//Calculate Bollinger Band data
        // Formula
		// SMA: 10 period sum / 10 for the first EMA
		// Multiplier: (2 / (Time periods + 1) ) = (2 / (10 + 1) ) = 0.1818 (18.18%)
		// EMA: {Close - EMA(previous day)} x multiplier + EMA(previous day). 

		//. First, calculate the simple moving average. An exponential moving average (EMA) has to start somewhere 
		//so a simple moving average is used as the previous period's EMA in the first calculation.
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

        for (var index = bllngrbndOptions.period; index < data.length; index++) {

        	var price =getPrice(data,index,bllngrbndOptions,type);
        	//Calculate EMA - start
       		//ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
       		var emaValue = (price * 2 / (bllngrbndOptions.period + 1)) + ((emaData[index - 1][1] || emaData[index - 1].y) * (1 - 2 / (bllngrbndOptions.period + 1)))
       		emaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(emaValue, 4)]);
            //Calculate EMA - end
		}
		return emaData;
	}

    function calculateEMAValue(data,period) {
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

	function calculateTEMA(data,bllngrbndOptions,type)
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
	    for (var index = 0; index < data.length; index++) {
	    	var price=getPrice(data,index,bllngrbndOptions,type);
	        inputData.push([data[index].x ? data[index].x : data[index][0], price]);
	    }
	    var ema1Data = calculateEMAValue(inputData,bllngrbndOptions.period);
	    var ema2Data = calculateEMAValue(ema1Data,bllngrbndOptions.period);
	    var ema3Data = calculateEMAValue(ema2Data,bllngrbndOptions.period);
	    var temaData = [];
	    for (var index = 0; index < ema3Data.length; index++) {
	        var temaVal = 3 * ema1Data[index][1] - 3 * ema2Data[index][1] + ema3Data[index][1];
	        temaData.push([ema3Data[index][0], indicatorBase.toFixed(temaVal, 4)]);
	    }      
        return temaData;
	}

    function calculateWMAValue(data,bllngrbndOptions,index, type)
    {
        var wmaValue = 0;
        for (var subIndex = index, count = bllngrbndOptions.period; subIndex >= 0 && count >= 0; count--, subIndex--) {
            var price =getPrice(data,subIndex,bllngrbndOptions,type);
            wmaValue += price * count;
        }
        return wmaValue / (bllngrbndOptions.period * (bllngrbndOptions.period + 1) / 2);
    }

	function calculateWMA(data,bllngrbndOptions,type)
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

	function calculateTRIMA(data,bllngrbndOptions,type)
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
            var price=getPrice(data,index,bllngrbndOptions,type);
            //Calculate TRIMA - start
            var trimaValue = (trimaData[index - 1][1] * (Nm - 1) + price) / Nm;
            trimaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(trimaValue , 4)]);
            //Calculate TRIMA - end
        }
        return trimaData;
	}

    function calculateMiddleBand(data,bllngrbndOptions,type)
    {
     var bllngrMdlBndData=[];
     switch(bllngrbndOptions.maType) {
	     case "SMA":
	        bllngrMdlBndData=calculateSMA(data,bllngrbndOptions,type);
	        break;
	     case "EMA":
	         bllngrMdlBndData=calculateEMA(data,bllngrbndOptions,type);
	        break;
	     case "WMA":
	        bllngrMdlBndData=calculateWMA(data,bllngrbndOptions,type);
	        break;
	     case "TEMA":
	        bllngrMdlBndData=calculateTEMA(data,bllngrbndOptions,type);
	        break;
	     case "TRIMA":
	        bllngrMdlBndData=calculateTRIMA(data,bllngrbndOptions,type);
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
             bllngrLwrBndData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(lwrBndVal, 4)]);
            //Calculate Lower Band - End                    
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
             bllngrUprBandData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(UprBndVal, 4)]);
            //Calculate Uper Band - End
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

                    var mddlUniqueID = '_m' + new Date().getTime();
                    var upUniqueID = '_u' + new Date().getTime();
                    var dwnUniqueID = '_d' + new Date().getTime();

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
                        var bllngrMiddleBandData=calculateMiddleBand(data,bllngrbndOptions,this.options.type);

        				var bllngrUperBandData=calculateUperBand(data,bllngrMiddleBandData,bllngrbndOptions,this.options.type);

        				var bllngrLowerBandData=calculateLowerBand(data,bllngrMiddleBandData,bllngrbndOptions,this.options.type);

   						var chart = this.chart;
 
                        bllngrbndOptionsMap[mddlUniqueID] = bllngrbndOptions;
                        bllngrbndOptionsMap[upUniqueID]=bllngrbndOptions;
                        bllngrbndOptionsMap[dwnUniqueID]=bllngrbndOptions;

                        //Bollinger Middle Band
                        var series = this;
                        bllngrbndSeriesMap[mddlUniqueID] = chart.addSeries({
                            id: mddlUniqueID,
                            name: 'BLLNGRBND(MDDLBND' + bllngrbndOptions.period  + ')',
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
                        bllngrbndSeriesMap[upUniqueID] = chart.addSeries({
                            id: upUniqueID,
                            name: 'BLLNGRBND(UPRBND' + bllngrbndOptions.period  + ')',
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
                        bllngrbndSeriesMap[dwnUniqueID] = chart.addSeries({
                            id: dwnUniqueID,
                            name: 'BLLNGRBND(LWRBND' + bllngrbndOptions.period  + ')',
                            data: bllngrLowerBandData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: bllngrbndOptions.lwrBndStroke,
                            lineWidth: bllngrbndOptions.strokeWidth,
                            dashStyle: bllngrbndOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(bllngrbndSeriesMap[mddlUniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'bllngrbnd',
                            isIndicator: true,
                            parentSeriesID: bllngrbndOptions.parentSeriesID,
                            period: bllngrbndOptions.period
                        });
                          $(bllngrbndSeriesMap[upUniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'bllngrbnd',
                            isIndicator: true,
                            parentSeriesID: bllngrbndOptions.parentSeriesID,
                            period: bllngrbndOptions.period
                        });
                            $(bllngrbndSeriesMap[dwnUniqueID]).data({
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
                    bllngrbndOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    bllngrbndSeriesMap[uniqueID] = null;
                    chart.redraw();
                }

                H.wrap(H.Series.prototype, 'addPoint', function(pbllngbndseed, options, redraw, shift, animation) {

                    pbllngbndseed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(bllngrbndOptionsMap, this.options.id)) {
                        updateBLLNGRBNDSeries.call(this, options);
                    }

                });

                H.wrap(H.Point.prototype, 'update', function(pbllngbndseed, options, redraw, animation) {

                    pbllngbndseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(bllngrbndOptionsMap, this.series.options.id)) {
                        updateBLLNGRBNDSeries.call(this.series, options, true);
                    }

                });

 				function updateBLLNGRBNDSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    ///TO DO
				}

    		  })(Highcharts, jQuery,indicatorBase);
    	}
    }
});
