define(["common/util"], function() {

    return {
        tickReceived : function(chartingRequest, instrumentCodeAndTimeperiod, time, price, barsTable) {
            
            if (chartingRequest && chartingRequest.chartIDs && chartingRequest.chartIDs.length > 0) {
                var timeperiod = $(chartingRequest.chartIDs[0].containerIDWithHash).data('timeperiod');
                if (timeperiod) {

                    var bar = undefined;
                    if (isTick(timeperiod)) 
                    {
                        //Update OHLC with same value in DB
                        barsTable.insert({
                                instrumentCdAndTp : instrumentCodeAndTimeperiod,
                                time: time,
                                open: price,
                                high: price,
                                low: price,
                                close: price
                          });
                    } else 
                    {
                        //Just update high/low/close price in DB as necessary
                        bar = barsTable.chain()
                                        .find({instrumentCdAndTp : instrumentCodeAndTimeperiod})
                                        .simplesort("time", true)
                                        .limit(1)
                                        .data();
                        if (!bar || bar.length <= 0) {
                            console.log('There are no bars in barsTable for instrumentCdAndTp : ' + instrumentCodeAndTimeperiod);
                            return;
                        } else {
                            bar = bar[0];
                        }
                        if (price < bar.low) {
                            bar.low = price;
                        } else if (price > bar.high) {
                            bar.high = price;
                        }
                        bar.close = price;
                        barsTable.update(bar);
                    }

                    //notify all registered charts
                    for (var index in chartingRequest.chartIDs) {

                        var chartID     = chartingRequest.chartIDs[index];
                        var chart       = $(chartID.containerIDWithHash).highcharts();
                        if (!chart) continue;

                        var series      = chart.get(instrumentCodeAndTimeperiod);
                        if (!series) continue;
                        
                        var type        = $(chartID.containerIDWithHash).data('type');
                        
                        if (isTick(timeperiod)) 
                        {
                            series.addPoint([time, price]);
                        } else 
                        {
                            //Just update high/low/close price in DB as necessary
                            var last = series.data[series.data.length - 1];
                            //console.log('Updating data point');
                            if ( type && isDataTypeClosePriceOnly(type) )
                            {
                                //console.log('I am updating just one data point! (before) ' + series.name + " " + series.data.length);
                                //Only update when its not in loading mode
                                console.log(series.options.name, last.x, price, instrumentCodeAndTimeperiod);
                                last.update([last.x, price]);
                                //console.log('I am updating just one data point! (after) ' + series.name + " " + series.data.length);
                            }
                            else if (bar)
                            {
                                //console.log(timeInMillis + " " + endTimeInMillis + " " + open + " " + high + " " + low + " " + close);
                                last.update([last.x, bar.open, bar.high, bar.low, bar.close]);
                            }
                        }//Non-tick chart condition ends
                    } //For loop ends
                } //timeperiod check if
            }//chartRequest check if
        }//tickReceived method ends
    };

});