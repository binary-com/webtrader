define(['websockets/binary_websockets','charts/chartingRequestMap','jquery','common/util'], function(liveapi, chartingRequestMap, $) {

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
         * @param type
         * @param instrumentName
         * @param series_compare
         */
        retrieveChartDataAndRender: function( options )
        {

            var timePeriod = options.timePeriod,
                instrumentCode = options.instrumentCode,
                containerIDWithHash = options.containerIDWithHash,
                type = options.type,
                instrumentName = options.instrumentName,
                series_compare = options.series_compare,
                isDelayedInstrument = options.delayAmount > 0;

            var totalSeconds = convertToTimeperiodObject(timePeriod).timeInSeconds();
            var key = (instrumentCode + totalSeconds).toUpperCase();

            //We are only going to request 1000 bars if possible
            var count = 1000;
            var rangeStartDate = (new Date().getTime() / 1000 - count * totalSeconds) | 0;
            console.log('Number of bars requested : ', count);

            //If the start time is less than 3 years, adjust the start time
            var _3YearsBack = new Date();
            _3YearsBack.setUTCFullYear(_3YearsBack.getUTCFullYear() - 3);
            //Going back exactly 3 years fails. I am adding 1 day
            _3YearsBack.setDate(_3YearsBack.getDate() + 1);

            if ((rangeStartDate * 1000) < _3YearsBack.getTime()) {
                console.log('Start time before change : ', rangeStartDate);
                rangeStartDate = (_3YearsBack.getTime() / 1000) | 0;
                console.log('Start time after change : ', rangeStartDate);
            }

            if (!$.isEmptyObject(chartingRequestMap[key])) {
                //Since streaming for this instrument+timePeriod has already been requested,
                //we just take note of containerIDWithHash so that once the data is received, we will just
                //call refresh for all registered charts
                chartingRequestMap[key].chartIDs.push({
                        containerIDWithHash : containerIDWithHash,
                        series_compare : series_compare,
                        instrumentCode : instrumentCode,
                        instrumentName : instrumentName
                    });
                //We still need to call refresh the chart with data we already received
                //Use local caching to retrieve that data.
                chartingRequestMap.barsLoaded(key);
                return;
            }

            chartingRequestMap[key] = chartingRequestMap[key] || {};
            chartingRequestMap[key].chartIDs = [
                    {
                        containerIDWithHash : containerIDWithHash,
                        series_compare : series_compare,
                        instrumentCode : instrumentCode,
                        instrumentName : instrumentName
                    }
            ];

            //Send the WS request
            var requestObject = {
                "ticks_history": instrumentCode,
                "end": 'latest',
                "count": count,
                "adjust_start_time" : 1,
                "granularity":  totalSeconds
              };
            if (!isTick(timePeriod)) {
                  requestObject.start = rangeStartDate;
                  requestObject.style = "candles";
            }
            if (isDelayedInstrument !== true) {
                requestObject.subscribe = 1;
            }
            console.log(JSON.stringify(requestObject));
            liveapi.send(requestObject)
                   .catch(function(err){
                       require(["jquery", "jquery-growl"], function($) {
                           $.growl.error({ message: "Error getting data for " + requestObject.ticks_history + "!" });
                       });
                       console.error(err);
                   })
                    .then(function(data) {
                        if (data && !data.error) {
                            if (isDelayedInstrument) {
                                //start the timer
                                chartingRequestMap[key].timerHandler = setInterval(function() {
                                    //Avoid global notification - TODO
                                    //Consume this notification - TODO
                                    $(document).trigger("feedTypeNotification", [key, "delayed-feed"]);
                                    var lastBar = barsTable.chain()
                                                            .find({instrumentCdAndTp : key})
                                                            .simplesort('time', true)
                                                            .limit(1)
                                                            .data();
                                    if (lastBar && lastBar.length > 0) {
                                        lastBar = lastBar[0];
                                        console.log('LastBar : ', lastBar);
                                        //requests new bars
                                        //Send the WS request
                                        var requestObject = {
                                            "ticks_history": instrumentCode,
                                            "end": 'latest',
                                            //"count": count,
                                            "start": (lastBar.time/1000) | 0,
                                            "granularity":  convertToTimeperiodObject(timePeriod).timeInSeconds()
                                        };
                                        console.log('Timer based request >> ', JSON.stringify(requestObject));
                                        liveapi.send(requestObject);
                                    }
                                }, 60*1000);
                            }
                        }
                    });
        }
    };

});
