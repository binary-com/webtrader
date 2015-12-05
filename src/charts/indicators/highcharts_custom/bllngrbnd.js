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

     	var variance=sumDeviations/j;
     	//The standard deviation is equal to the square root of the variance:
        return standardDeviation=Math.sqrt(variance);
	}
	
   //  function calculateSMA(data,index,bllngrbndOptions,type)
   //  {
   //  	var sum=0;
   //   	for(var i=0; i<bllngrbndOptions.period && index>=0; i++)
   //   	{
   //   		sum+=getPrice(data,index,bllngrbndOptions,type);
   //   		index--;
   //   	}
 		// return sum/i;
   //  }

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

    function calculateEMA(data,index,bllngrbndOptions,type,preEma)
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
        
            if (index == (emaOptions.period - 1)) {
                emaData.push([data[emaOptions.period - 1].x ? data[emaOptions.period - 1].x : data[emaOptions.period - 1][0], sum / emaOptions.period]);
            }
             else {
                emaData.push([data[index].x ? data[index].x : data[index][0], null]);
            }
        }

        for (var index = emaOptions.period; index < data.length; index++) {

        	var price =getPrice(data,index,bllngrbndOptions,type);
        	//Calculate EMA - start
       		//ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
       		var emaValue = (price * 2 / (bllngrbndOptions.period + 1)) + ((emaData[index - 1][1] || emaData[index - 1].y) * (1 - 2 / (bllngrbndOptions.period + 1)))
       		emaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(emaValue, 4)]);
            //Calculate EMA - end
		}
		return emaData;
	}

    function calculateLowerBand(data,index,bllngrbndOptions,type,ma)
    {
    	//var sma=calculateSMA(data,index,bllngrbndOptions,type);
    	var standardDeviation=calculateStandardDeviation(data,index,bllngrbndOptions,type,ma);
    	//Lower Band = 20-day SMA - (20-day standard deviation of price x 2)
    	var lowerbandValue=ma-(standardDeviation*bllngrbndOptions.devDn);
    	return lowerbandValue;
    }


    function calculateUperBand(data,index,bllngrbndOptions,type,ma)
    {
    	//var sma=calculateSMA(data,index,bllngrbndOptions,type);
    	var standardDeviation=calculateStandardDeviation(data,index,bllngrbndOptions,type,ma);
    	//Lower Band = 20-day MA + (20-day standard deviation of price x 2)
    	return uperBandValue=ma+(standardDeviation*bllngrbndOptions.devUp);
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
                        mdlBndStroke: 'red',
                        uprBndStroke:'#A52A2A',
                        lwrBndStroke:'#A52A2A',
                        strokeWidth: 1,
                        dashStyle: 'line',
                        //levels: [],
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
                        var bllngrMiddleBandData = [],bllngrLowerBandData=[],bllngrUperBandData=[];

                            //Calculate Uper Band(SMA) - Start
						    // var smaValue = calculateSMA(data, index,bllngrbndOptions,this.options.type);
       						// bllngrMiddleBandData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(smaValue, 4)]);
        				bllngrMiddleBandData=calculateSMA(data,bllngrbndOptions,this.options.type);
                             //Calculate SMA - end
                        for (var index = 0; index < data.length; index++)
                        {
                             //Calculate Lower Band - start
                             var lowerBandValue = calculateLowerBand(data, index,bllngrbndOptions,this.options.type,bllngrMiddleBandData[index][1]);
                             bllngrLowerBandData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(lowerBandValue, 4)]);
                             //Calculate Lower Band - End

                             //Calculate Uper Band - start
                             var uperBandValue = calculateUperBand(data, index,bllngrbndOptions,this.options.type,bllngrMiddleBandData[index][1]);
                             bllngrUperBandData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(uperBandValue, 4)]);
 							 //Calculate Uper Band - end                          
                          }

  						var chart = this.chart;
 
 						//bllngrbndOptionsMap[uniqueID] = bllngrbndOptions;
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
                    chart.get(uniqueID).remove(false);
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
