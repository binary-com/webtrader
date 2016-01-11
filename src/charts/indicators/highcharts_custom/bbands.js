/*
Created by Mahboob.M on 26.11.2015
*/
define(['jquery', 'indicator_base', 'highcharts-more'],function($, indicatorBase) {

	var bbandsOptionsMap = {}, 
	    bbandsMdlSeriesMap = {},
	    bbandsUprSeriesMap = {},
	    bbandsLwrSeriesMap = {};
    
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
    	    var price = indicatorBase.getPrice(data, index, bbandsOptions.appliedTo, type);
            //calculate the deviations of each data point from the mean, and square the result of each
     		var deviation =Math.pow(price-average,2);
			sumDeviations+=deviation;
     		--index;
	    }

        return Math.sqrt(sumDeviations/j);
	}

    function calculateLowerBand(data, bbandsMddlBndData, bbandsOptions, type)
    {
    	var bbandsLwrBndData=[];
    	for (var index = 0; index < data.length; index++)
        {
        	//Calculate Lower Band - start
    	    var ma = indicatorBase.getIndicatorData(bbandsMddlBndData, index);
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
    	    var ma = indicatorBase.getIndicatorData(bbandsMddlBndData, index);
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
                        var bbandsMiddleBandData = [];
                        for (var index = 0; index < data.length; index++)
                        {
                            var maOptions = {
                                data: data,
                                maData: bbandsMiddleBandData,
                                index: index,
                                period: bbandsOptions.period,
                                maType: bbandsOptions.maType,
                                type: this.options.type,
                                key: mdlUniqueID,
                                isPointUpdate: false,
                                appliedTo: bbandsOptions.appliedTo,
                                isIndicatorData: false
                            };
                            var middleBandvalue = indicatorBase.calculateMAValue(maOptions);
                            bbandsMiddleBandData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(middleBandvalue, 4)])
                        }

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
                        //var seriesAreaData = [];
                        //bbandsLowerBandData.forEach(function(eachLwr, index) {
                        //    var data = [eachLwr[0], eachLwr[1], bbandsUperBandData[index][1]];
                        //    seriesAreaData.push(data);
                        //});
                        //chart.addSeries({
                        //    id: rangeUniqueID,
                        //    data: seriesAreaData,
                        //    name: "BBANDS Range",
                        //    type: 'arearange',
                        //    dataGrouping: series.options.dataGrouping,
                        //    opposite: series.options.opposite,
                        //    color: 'white',
                        //    fillColor: 'rgba(28,28,28,0.5)',
                        //    connectNulls: true,
                        //    compare: series.options.compare,
                        //    //Following properties, states, events, dataLabels, point are needed. Otherwise higcharts-more throws error
                        //    states: {
                        //        hover: {
                        //            enabled: false
                        //        }
                        //    },
                        //    events : {},
                        //    dataLabels : {
                        //        enabled : false
                        //    },
                        //    point: {
                        //        events: {}
                        //    },
                        //    enableMouseTracking: false
                        //}, false, false);

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
                                indicatorBase.EMA1[uniqueID] = [];
                                indicatorBase.EMA2[uniqueID] = [];
                                indicatorBase.EMA3[uniqueID] = [];
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
                        //updateBBANDS_range.call(this, options[0]);
                    }
                });

                H.wrap(H.Point.prototype, 'update', function(pbllngbndseed, options, redraw, animation) {
                    pbllngbndseed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(bbandsOptionsMap, this.series.options.id)) {
                        console.log('BBANDS : Updating BB values for main series ID : ', this.series.options.id);
                        updateBBANDSMDLBNDSeries.call(this.series, this.x, true);
                        updateBBANDSUPRBNDSeries.call(this.series, this.x, true);
                        updateBBANDSLWRBNDSeries.call(this.series, this.x, true);
                        //updateBBANDS_range.call(this.series, this.x, true);
                    }
                });

 				function updateBBANDSMDLBNDSeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new data point
                    for (var key in bbandsMdlSeriesMap) {
                        if (bbandsMdlSeriesMap[key] && bbandsMdlSeriesMap[key].options
                            && bbandsMdlSeriesMap[key].options.data
                            && bbandsMdlSeriesMap[key].options.data.length > 0
                            && bbandsOptionsMap[key].parentSeriesID == series.options.id
                            && bbandsMdlSeriesMap[key].chart === chart
                        ) {
                            //Find the data point
                            var data = series.options.data;
                            var maData = bbandsMdlSeriesMap[key].options.data;
                            var bbandsOptions=bbandsOptionsMap[key];
                            var middleBandData = bbandsMdlSeriesMap[key].options.data;
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {
                                var maOptions = {
                                    data: data,
                                    maData: maData,
                                    index: dataPointIndex,
                                    period: bbandsOptions.period,
                                    maType: bbandsOptions.maType,
                                    type: this.options.type,
                                    key: key,
                                    isPointUpdate: isPointUpdate,
                                    appliedTo: bbandsOptions.appliedTo,
                                    isIndicatorData: false
                                };
                                var maValue = indicatorBase.calculateMAValue(maOptions);
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
                            && bbandsOptionsMap[key].parentSeriesID == series.options.id
                            && bbandsUprSeriesMap[key].chart === chart
                        ) {
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
                            && bbandsOptionsMap[key].parentSeriesID == series.options.id
                            && bbandsLwrSeriesMap[key].chart === chart
                        ) {
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
                            && bbandsOptionsMap[key].parentSeriesID == series.options.id
                            && bbandsUprSeriesMap[key].chart === chart
                        ) {
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
                                chart.series.forEach(function (eachSeries) {
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
