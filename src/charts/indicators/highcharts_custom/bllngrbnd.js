/*
Created by Mahboob.M on 26.11.2015
*/
define(['indicator_base', 'highstock'],function(indicatorBase){

	var bllngrbndOptionsMap = {}, bllngrbndSeriesMap = {};
     
    function calculateStandardDeviation(data,index,bllngrbndOptions,type,average)
    {
        var sumDeviations=0;
    	for(var j=0;j<bllngrbndOptions.period;j++)
     	{
     		if(index>=0)
     		{
     			 var price = 0.0;
                 if (indicatorBase.isOHLCorCandlestick(type)) {
                    price = indicatorBase.extractPriceForAppliedTO(bllngrbndOptions.appliedTo, data, index);
                 }
                 else {
                    price = data[index].y ? data[index].y : data[index][1];
                 }
                //calculate the deviations of each data point from the mean, and square the result of each
     			var deviation =Math.pow(price-average,2);
				sumDeviations+=deviation;
     			--index;
	     	}
     	}
     	/////todo
     	var variance=sumDeviations/bllngrbndOptions.period;
     	//The standard deviation is equal to the square root of the variance:
        return standardDeviation=Math.sqrt(variance);
	}

    function calculateMiddleBand(data,index,bllngrbndOptions,type)
    {
    	var sum=0;
     	for(var i=0; i<bllngrbndOptions.period && index>=0; i++)
     	{
     		
     			 var price = 0.0;
                 if (indicatorBase.isOHLCorCandlestick(type)) {
                    price = indicatorBase.extractPriceForAppliedTO(bllngrbndOptions.appliedTo, data, index);
                 }
                 else {
                    price = data[index].y ? data[index].y : data[index][1];
                 }

     			sum+=price;
     			--index;
	     	
     	}
     	/////////////tedad
 		return sum/bllngrbndOptions.period;
    }

    function calculateLowerBand(data,index,bllngrbndOptions,type)
    {
    	var sma=calculateMiddleBand(data,index,bllngrbndOptions,type);
    	var standardDeviation=calculateStandardDeviation(data,index,bllngrbndOptions,type,sma);
    	//Lower Band = 20-day SMA - (20-day standard deviation of price x 2)
    	var lowerbandValue=sma-(standardDeviation*2);
    	return lowerbandValue;
    }


    function calculateUperBand(data,index,bllngrbndOptions,type)
    {
    	var sma=calculateMiddleBand(data,index,bllngrbndOptions,type);
    	var standardDeviation=calculateStandardDeviation(data,index,bllngrbndOptions,type,sma);
    	//Lower Band = 20-day SMA + (20-day standard deviation of price x 2)
    	return uperBandValue=sma+(standardDeviation*2);
    }

    return {
    	init:function(){
    		  (function(H,$,indicatorBase) {
    		  	if (!H || H.Series.prototype.addBOP) return;

                H.Series.prototype.addBLLNGRBND = function ( bllngrbndOptions ) {

                    var seriesID = this.options.id;
                    bllngrbndOptions = $.extend({
                        period: 21,
                        stroke: 'red',
                        strokeWidth: 1,
                        dashStyle: 'line',
                        levels: [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID: seriesID
                    }, bllngrbndOptions);


                    var uniqueID = '_' + new Date().getTime();

                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {
                        //Calculate Bollinger Band data
                        /*
                         * Formula
                            Bollinger Band:
                            	* Middle Band = 20-day simple moving average (SMA)
  								* Upper Band = 20-day SMA + (20-day standard deviation of price x 2) 
  								* Lower Band = 20-day SMA - (20-day standard deviation of price x 2)

  							SMA:
  								* N period sum / N

  							Standard Dviation :
  								1-Calculate the average (mean) price for the number of periods or observations.
								2-Determine each period's deviation (close less average price).
								3-Square each period's deviation.
								4-Sum the squared deviations.
								5-Divide this sum by the number of observations.
								6-The standard deviation is then equal to the square root of that number.
                         */
                          var bllngrMiddleBandData = [],bllngrLowerBandData=[],bllngrUperBandData=[];

                          for (var index = 0; index < data.length; index++)
                          {
                            //Calculate Uper Band(SMA) - Start
							 var smaValue = calculateMiddleBand(data, index,bllngrbndOptions,this.options.type);
                             bllngrMiddleBandData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(smaValue, 4)]);
                             //Calculate SMA - end

                             //Calculate Lower Band - start
                             var lowerBandValue = calculateLowerBand(data, index,bllngrbndOptions,this.options.type);
                             bllngrLowerBandData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(lowerBandValue, 4)]);
                             //Calculate Lower Band - End

                             //Calculate Uper Band - start
                             var uperBandValue = calculateUperBand(data, index,bllngrbndOptions,this.options.type);
                             bllngrUperBandData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(uperBandValue, 4)]);
 							 //Calculate Uper Band - end                          
                          }

  						var chart = this.chart;

                        bllngrbndOptionsMap[uniqueID] = bllngrbndOptions;

                        //Bollinger Middle Band
                        var series = this;
                        bllngrbndSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'BLLNGRBND(MDDLBND' + bllngrbndOptions.period  + ')',
                            data: bllngrMiddleBandData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: "blue",
                            lineWidth: bllngrbndOptions.strokeWidth,
                            dashStyle: bllngrbndOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //Bollinger Lower Band
                        var series = this;
                        bllngrbndSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'BLLNGRBND(LWRBND' + bllngrbndOptions.period  + ')',
                            data: bllngrLowerBandData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: "#A52A2A",
                            lineWidth: bllngrbndOptions.strokeWidth,
                            dashStyle: bllngrbndOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //Bollinger Uper Band
                        var series = this;
                        bllngrbndSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'BLLNGRBND(UPRBND' + bllngrbndOptions.period  + ')',
                            data: bllngrUperBandData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            opposite: series.options.opposite,
                            color: "#A52A2A",
                            lineWidth: bllngrbndOptions.strokeWidth,
                            dashStyle: bllngrbndOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);


                        //This is a on chart indicator
                        $(bllngrbndSeriesMap[uniqueID]).data({
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
