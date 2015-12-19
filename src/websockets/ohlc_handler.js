define(['websockets/binary_websockets',"charts/chartingRequestMap","jquery", "jquery-timer", 'common/util'], function(liveapi, chartingRequestMap, $) {

    var barsTable = chartingRequestMap.barsTable;

    function processCandles(key, time, open, high, low, close) {
        var bar   = barsTable.chain()
            .find({time : time})
            .find({instrumentCdAndTp : key})
            .limit(1)
            .data();
        if (bar && bar.length > 0) {
            bar = bar[0];
            bar.open = open;
            bar.high = high;
            bar.low = low;
            bar.close = close;
            barsTable.update(bar);
        } else {
            barsTable.insert({
                instrumentCdAndTp : key,
                time: time,
                open: open,
                high: high,
                low: low,
                close: close
            });
        }
    };

    liveapi.events.on('candles', function (data) {
        var key = (data.echo_req.ticks_history + data.echo_req.granularity).toUpperCase();
        for ( var index in data.candles ) {
            var eachData = data.candles[index],
                    open  = parseFloat(eachData.open),
                    high  = parseFloat(eachData.high),
                    low   = parseFloat(eachData.low),
                    close = parseFloat(eachData.close),
                    time  = parseInt(eachData.epoch) * 1000;
            processCandles(key, time, open, high, low, close);
        }
        chartingRequestMap.barsLoaded(key);
    });
    liveapi.events.on('history', function (data) {
        //For tick history handling
        var key = (data.echo_req.ticks_history + '0').toUpperCase();
        for (var index in data.history.times) {
            var time = parseInt(data.history.times[index]) * 1000,
                price = parseFloat(data.history.prices[index]);
            processCandles(key, time, price, price, price, price);
        }
        chartingRequestMap.barsLoaded(key);
    });

    return {

        /**
         * @param timePeriod
         * @param instrumentCode
         * @param containerIDWithHash
         * @param instrumentName
         * @param series_compare
         */
        retrieveChartDataAndRender: function(options) {
            var timePeriod = options.timePeriod,
                instrumentCode = options.instrumentCode,
                containerIDWithHash = options.containerIDWithHash,
                instrumentName = options.instrumentName,
                series_compare = options.series_compare;

            var key = chartingRequestMap.keyFor(instrumentCode, timePeriod);
            if (chartingRequestMap[key]) {
                /* Since streaming for this instrument+timePeriod has already been requested,
                   we just take note of containerIDWithHash so that once the data is received, we will just
                   call refresh for all registered charts */
                chartingRequestMap[key].chartIDs.push({
                        containerIDWithHash : containerIDWithHash,
                        series_compare : series_compare,
                        instrumentCode : instrumentCode,
                        instrumentName : instrumentName
                    });
                /* We still need to call refresh the chart with data we already received
                   Use local caching to retrieve that data.*/
                chartingRequestMap.barsLoaded(key);
                return;
            }

            chartingRequestMap.register({
              symbol: instrumentCode,
              granularity: timePeriod,
              subscribe: options.delayAmount === 0 ? 1 : 0,
              style: !isTick(timePeriod) ? 'candles' : 'ticks',
              count: 1000,          //We are only going to request 1000 bars if possible
              adjust_start_time: 1
            })
            .catch(function(err){
               require(["jquery", "jquery-growl"], function($) {
                   $.growl.error({ message: "Error getting data for " + instrumentCode + "!" });
               });
               console.error(err);
            })
            .then(function(data) {
                if (data && !data.error && options.delayAmount > 0) {
                    //start the timer
                    chartingRequestMap[key].timerHandler = '_' + new Date().getTime();
                    $(document).everyTime(60000, chartingRequestMap[key].timerHandler, function() {
                        //TODO: Avoid global notification - TODO:Consume this notification
                        $(document).trigger("feedTypeNotification", [key, "delayed-feed"]);
                        var lastBar = barsTable.chain()
                                            .find({instrumentCdAndTp : key})
                                            .simplesort('time', true)
                                            .limit(1).data();
                        if (!lastBar || lastBar.length === 0)
                          return;

                        lastBar = lastBar[0];
                        //requests new bars, Send the WS request
                        var requestObject = {
                            "ticks_history": instrumentCode,
                            "end": 'latest',
                            "start": (lastBar.time/1000) | 0,
                            "granularity":  convertToTimeperiodObject(timePeriod).timeInSeconds()
                        };
                        console.log('Timer based request >> ', JSON.stringify(requestObject));
                        liveapi.send(requestObject).catch(function(err){ console.error(err.message); });
                    });
                }
            });

            chartingRequestMap[key].chartIDs.push({
                        containerIDWithHash : containerIDWithHash,
                        series_compare : series_compare,
                        instrumentCode : instrumentCode,
                        instrumentName : instrumentName
            });
        }
    };

});
