/**
 * Created by Mahbobeh on 12/9/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var sarOptionsMap = {}, sarSeriesMap = {};
    var epArray={},  afArray = {},sarArray={},trendArray={};
    var open= 0, high= 1, low=2, close= 3;
     //******************************Get Price*************************
    function calculateSarValue(data,index,sarOptions,key,isPointUpdate)
    {
        var ep = epArray[key],  af = afArray[key] , sar=sarArray[key] , trend=trendArray[key];
        var preIndex=index-1>=0?index-1:0;
        var price=indicatorBase.extractPrice(data,index);
        var highPrice=indicatorBase.extractPriceForAppliedTO(high, data, index);
        var lowPrice=indicatorBase.extractPriceForAppliedTO(low, data, index);
        var currentSar=sar[preIndex]+af[preIndex]*(ep[preIndex]-sar[preIndex]);
        var minPrice=Math.min(indicatorBase.extractPriceForAppliedTO(low, data, preIndex),indicatorBase.extractPriceForAppliedTO(low, data, preIndex-1));
        var maxPrice=Math.max(indicatorBase.extractPriceForAppliedTO(high, data, preIndex),indicatorBase.extractPriceForAppliedTO(high, data, preIndex-1));
        var sarValue = trend[preIndex]==trend[preIndex-1]?
                     trend[preIndex]=="UP"?
                        (currentSar<minPrice?currentSar:minPrice):
                        (currentSar>maxPrice?currentSar:maxPrice)
                    :ep[preIndex];
        if (isPointUpdate)
        {
            sar[index]=sarValue;
        }
        else
        {
            sar.push(sarValue);
        }

        var epValue = trend[preIndex]=="UP"?
                     (highPrice>ep[preIndex]?highPrice:ep[preIndex])
                     :(lowPrice<ep[preIndex]?lowPrice:ep[preIndex]);
       
        if (isPointUpdate)
        {
            ep[index]=epValue;
        }
        else
        {
            ep.push(epValue);
        }

        trendDirection=trend[preIndex]=="UP"?
                     (lowPrice>sarValue?"UP":"DOWN")
                     :(highPrice<sarValue?"DOWN":"UP");      

        if (isPointUpdate)
        {
            trend[index]=trendDirection;
        }
        else
        {
            trend.push(trendDirection);
        }
        
        var afValue=trend[index]==trend[preIndex]?
             (trend[index]=="UP"?
                ep[index]>ep[preIndex]?(af[preIndex]==sarOptions.maximum?af[preIndex]:af[preIndex]+sarOptions.acceleration):af[preIndex]
               :ep[index]<ep[preIndex]?(af[preIndex]==sarOptions.maximum?af[preIndex]:af[preIndex]+sarOptions.acceleration):af[preIndex])
             :sarOptions.acceleration;
        

        if (isPointUpdate)
        {
            af[index]=afValue;
        }
        else
        {
            af.push(afValue);
        }

        epArray[key]=ep;
        afArray[key]=af;
        sarArray[key]=sar;
        trendArray[key]=trend;

        return sarValue;
    }
    
    return {
        init: function() {

            (function(H,$,indicatorBase) {
                 
                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addSAR) return;

                H.Series.prototype.addSAR = function ( sarOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    sarOptions = $.extend({
                        acceleration : 0.02,
                        maximum : 0.2,
                        stroke : 'red',
                        strokeWidth : 2,
                        dashStyle : 'line',
                        levels : [],
                        parentSeriesID : seriesID
                    }, sarOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add sar series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {
                        //Calculate SAR data
                        var period=5;
                        //Trend Direction :
                        // Up=0
                        //Down=1
                        var trendDirection='UP';
                        var sarData = [];
                        var ep = [],  af = [],sar=[],trend=[];
                        for (var index = 0; index < data.length; index++)
                        {
                            var price=indicatorBase.extractPrice(data,index);
                            var highPrice=indicatorBase.extractPriceForAppliedTO(high, data, index);
                            var lowPrice=indicatorBase.extractPriceForAppliedTO(low, data, index);
                            var preIndex=index-1>=0?index-1:0;
                            if(index<period)
                            {
                                sarData.push([(data[index].x || data[index][0]), 0]);
                                sar.push(0);
                                ep.push(0);
                                af.push(sar.acceleration);
                                trend.push('UP');
                            }
                            else if(index==period)
                            {
                                var sarValue=0,epValue=0;
                                for(var i=0; i<period; i++)
                                {
                                    var highPrice=indicatorBase.extractPriceForAppliedTO(high, data, index-i);
                                    var lowPrice=indicatorBase.extractPriceForAppliedTO(low, data, index-i);

                                     sarValue=Math.min(sarValue,lowPrice,highPrice);
                                     epValue=Math.max(sarValue,lowPrice,highPrice);
                                    // sarValue=Math.min(sarValue,indicatorBase.extractPrice(data,index-i));
                                }
                                sar.push(sarValue);
                                ep.push(epValue);

                                af.push(sarOptions.acceleration);

                                trendDirection=trend[preIndex]=="UP"?(lowPrice>sarValue?"UP":"DOWN"):(highPrice<sarValue?"DOWN":"UP");      
                                trend.push(trendDirection);

                                sarData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(sarValue , 4)]);
                            }
                            else
                            {   
                                epArray[uniqueID]=ep;
                                afArray[uniqueID]=af;
                                sarArray[uniqueID]=sar;
                                trendArray[uniqueID]=trend;

                                var sarValue=calculateSarValue(data,index,sarOptions,uniqueID,false);

                                sarData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(sarValue , 4)]);

                            }
                        }
                                                    

                        var chart = this.chart;

                        sarOptionsMap[uniqueID] = sarOptions;

                        var series = this;
                        sarSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'SAR(' + sarOptions.acceleration + "," + sarOptions.maximum  + ')',
                            data: sarData,
                            // type: 'scatter', 
                            lineWidth : 0,
                            marker : {
                                enabled : true,
                                // radius : sarOptions.strokeWidth
                            },
                            dataGrouping: series.options.dataGrouping,
                            // yAxis: 'sar'+ uniqueID,
                            opposite: series.options.opposite,
                            color: sarOptions.stroke,
                            //lineWidth: sarOptions.strokeWidth,
                            //dashStyle: sarOptions.dashStyle
                        }, false, false);

                        $(sarSeriesMap[uniqueID]).data({
                            isIndicator: true,
                            indicatorID: 'sar',
                            parentSeriesID: sarOptions.parentSeriesID,
                            period: sarOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeSAR = function (uniqueID) {
                    var chart = this.chart;
                    sarOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove(false);
                    chart.get('sar' + uniqueID).remove(false);
                    sarSeriesMap[uniqueID] = null;
                    //Recalculate the heights and position of yAxes
                    indicatorBase.recalculate(chart);
                    chart.redraw();
                }

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(sarOptionsMap, this.options.id)) {
                        updatesarSeries.call(this, options);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(sarOptionsMap, this.series.options.id)) {
                        updatesarSeries.call(this.series, options, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updatesarSeries(options, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new sar data point
                    for (var key in sarSeriesMap) {
                        if (sarSeriesMap[key] && sarSeriesMap[key].options && sarSeriesMap[key].options.data && sarSeriesMap[key].options.data.length > 0
                            && sarOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is sar series. Add one more sar point
                            var data = series.options.data;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options)+1;
                            var sarOptions=sarOptionsMap[key];
                            if (dataPointIndex >= 1) {

                                var sarValue=calculateSarValue(data,dataPointIndex,sarOptions,key,isPointUpdate && sarSeriesMap[key].options.data.length >= data.length);

                                if (isPointUpdate && sarSeriesMap[key].options.data.length >= data.length)
                                {
                                    sarSeriesMap[key].data[dataPointIndex].update([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(sarValue , 4)]);
                                }
                                else 
                                {
                                    sarSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(sarValue , 4)]);

                                }
                            }
                        }
                    }    
                }

            })(Highcharts, jQuery,indicatorBase);

        }
    }

});
