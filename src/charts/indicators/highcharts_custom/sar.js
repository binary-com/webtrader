/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var sarOptionsMap = {}, sarSeriesMap = {};
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
                        dashStyle : 'Dot',
                        levels : [],
                        parentSeriesID : seriesID
                    }, sarOptions);

                    var uniqueID = '_' + new Date().getTime();

                    //If this series has data, add sar series to the chart
                    var data = this.options.data || [];
                    if (data && data.length > 0)
                    {
                        //Calculate SAR data
                        var period=6;
                        //Trend Direction :
                        // Up=0
                        //Down=1
                        var trendDirection='UP';
                        var sarData = [], ep = [],  af = [],sar=[],trend=[];
                        for (var index = 0; index < data.length; index++)
                        {
                            var price=indicatorBase.extractPrice(data,index);
                            var highPrice=price,lowPrice=price;
                            // var highPrice=indicatorBase.extractPriceForAppliedTO(1, data, index);
                            // var lowPrice=indicatorBase.extractPriceForAppliedTO(2, data, index);
                            preIndex=index-1>=0?index-1:0;
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
                                var sarValue=price;
                                for(var i=0; i<period; i++)
                                {
                                    // var highPrice=indicatorBase.extractPriceForAppliedTO(1, data, index-i);
                                    // var lowPrice=indicatorBase.extractPriceForAppliedTO(2, data, index-i);

                                    // sarValue=Math.min(sarValue,lowPrice,highPrice);
                                    sarValue=Math.min(sarValue,indicatorBase.extractPrice(data,index-i));
                                }
                                sar.push(sarValue);
                                var epValue=0;
                                for(var i=0; i<period; i++)
                                {
                                    // var highPrice=indicatorBase.extractPriceForAppliedTO(1, data, index-i);
                                    // var lowPrice=indicatorBase.extractPriceForAppliedTO(2, data, index-i);

                                    epValue=Math.max(epValue,indicatorBase.extractPrice(data,index-i));
                                }
                                ep.push(epValue);

                                af.push(sarOptions.acceleration);

                                trendDirection=trend[preIndex]=="UP"?(lowPrice>sarValue?"UP":"DOWN"):(highPrice<sarValue?"DOWN":"UP");      
                                trend.push(trendDirection);

                                sarData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(sarValue , 4)]);
                            }
                            else
                            {   
                                var currentSar=sar[preIndex]+af[preIndex]*(ep[preIndex]-sar[preIndex]);
                                // minPrice=Math.min(indicatorBase.extractPriceForAppliedTO(2, data, preIndex),indicatorBase.extractPriceForAppliedTO(2, data, preIndex-1));
                                // maxPrice=Math.max(indicatorBase.extractPriceForAppliedTO(1, data, preIndex),indicatorBase.extractPriceForAppliedTO(1, data, preIndex-1));
                                minPrice=Math.min(indicatorBase.extractPrice(data, preIndex),indicatorBase.extractPrice(data, preIndex-1));
                                maxPrice=Math.max(indicatorBase.extractPrice(data, preIndex),indicatorBase.extractPrice(data, preIndex-1));
                                var sarValue = trend[preIndex]==trend[preIndex-1]?
                                             trend[preIndex]=="UP"?
                                                (currentSar<minPrice?currentSar:minPrice):
                                                (currentSar>maxPrice?currentSar:maxPrice)
                                            :ep[preIndex];
                                sar.push(sarValue);

                                var epValue = trend[preIndex]=="UP"?
                                             (highPrice>ep[preIndex]?highPrice:ep[preIndex])
                                             :(lowPrice<ep[preIndex]?lowPrice:ep[preIndex]);
                                ep.push(epValue);

                                trendDirection=trend[preIndex]=="UP"?(lowPrice>sarValue?"UP":"DOWN"):(highPrice<sarValue?"DOWN":"UP");      
                                trend.push(trendDirection);
                                
                                //var afValue=(ep[preIndex]!=0 && ep[preIndex]<epValue)?(af[preIndex] <sarOptions.maximum? af[preIndex]+sarOptions.acceleration:sarOptions.acceleration):af[preIndex];
                                var afValue=trend[index]==trend[preIndex]?
                                     (trend[index]=="UP"?
                                        ep[index]>ep[preIndex]?(af[preIndex]==sarOptions.maximum?af[preIndex]:af[preIndex]+sarOptions.acceleration):af[preIndex]
                                       :ep[index]<ep[preIndex]?(af[preIndex]==sarOptions.maximum?af[preIndex]:af[preIndex]+sarOptions.acceleration):af[preIndex])
                                     :af[preIndex];
                                af.push(afValue);

                                sarData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(sarValue , 4)]);

                            }
                        }
                                                    

                        var chart = this.chart;

                        sarOptionsMap[uniqueID] = sarOptions;

                        // chart.addAxis({ // Secondary yAxis
                        //     id: 'sar'+ uniqueID,
                        //     title: {
                        //         text: 'SAR(' + sarOptions.acceleration + "," + sarOptions.maximum  + ')',
                        //         align: 'high',
                        //         offset: 0,
                        //         rotation: 0,
                        //         y: 10, //Trying to show title inside the indicator chart
                        //         x: 50
                        //     },
                        //     lineWidth: 2
                        // }, false, false, false);

                        // indicatorBase.recalculate(chart);

                        var series = this;
                        sarSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'SAR(' + sarOptions.acceleration + "," + sarOptions.maximum  + ')',
                            data: sarData,
                             type: 'line', //TODO
                            dataGrouping: series.options.dataGrouping,
                            // yAxis: 'sar'+ uniqueID,
                            opposite: series.options.opposite,
                            color: sarOptions.stroke,
                            lineWidth: sarOptions.strokeWidth,
                            dashStyle: sarOptions.dashStyle
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
                            //Calculate sar data
                            /*
                             * Formula(OHLC or Candlestick) -
                             * 	rs(t) = avg-gain(n) / avg-loss(n)
                             *  sar(t) = if avg-loss(n) == 0 ? 100 : 100 - (100/ (1+rs(t))
                             * 		t - current
                             * 		n - period
                             */
                            //Find the data point
                            var data = series.options.data;
                            var n = sarOptionsMap[key].period;
                            var dataPointIndex = indicatorBase.findDataUpdatedDataPoint(data, options);
                            if (dataPointIndex >= 1) {
                                //Calculate sar - start
                                var sarValue = 0.0;
                                if (dataPointIndex >= n)
                                {

                                    var avgGain = 0, avgLoss = 0;
                                    //Calculate RS - start
                                    for (var i = dataPointIndex, count = 1; i > 0 && count <= n; i--, count++) {
                                        var price1 = indicatorBase.extractPrice(data, i-1);
                                        var price2 = indicatorBase.extractPrice(data, i);
                                        if (price2 > price1) avgGain += price2 - price1;
                                        if (price2 < price1) avgLoss += price1 - price2;
                                    }
                                    avgGain /= n;
                                    avgLoss /= n;
                                    var rs = avgGain / avgLoss;
                                    //Calculate RS - end

                                    sarValue = (avgLoss == 0 ? 100 : (100 - (100 / (1+rs))));

                                }
                                //Calculate sar - end
                                sarValue = indicatorBase.toFixed(sarValue , 2);

                                if (isPointUpdate)
                                {
                                    if (sarSeriesMap[key].options.data.length < data.length) {
                                        sarSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), sarValue]);
                                    } else {
                                        sarSeriesMap[key].data[dataPointIndex].update([(data[dataPointIndex].x || data[dataPointIndex][0]), sarValue]);
                                    }
                                }
                                else
                                {
                                    sarSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), sarValue]);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery,indicatorBase);

        }
    }

});
