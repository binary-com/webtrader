define(['websockets/binary_websockets','charts/chartingRequestMap','jquery','jquery-growl', 'common/util'], function(liveapi, chartingRequestMap, $) {

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
                chartingRequestMap.subscribe(key, {
                    containerIDWithHash : containerIDWithHash,
                    series_compare : series_compare,
                    instrumentCode : instrumentCode,
                    instrumentName : instrumentName
                });
                /* We still need to call refresh the chart with data we already received
                   Use local caching to retrieve that data.*/
                chartingRequestMap.barsLoaded(key);
                return Promise.resolve();
            }

            var done_promise = chartingRequestMap.register({
              symbol: instrumentCode,
              granularity: timePeriod,
              subscribe: options.delayAmount === 0 ? 1 : 0,
              style: !isTick(timePeriod) ? 'candles' : 'ticks',
              count: 1000,          //We are only going to request 1000 bars if possible
              adjust_start_time: 1
            })
            .catch(function(err){
                 var msg = 'Error getting data for '.i18n() + instrumentName + "";
                 require(["jquery", "jquery-growl"], function($) { $.growl.error({ message: msg }); });
                 var chart = $(containerIDWithHash).highcharts();
                 chart && chart.showLoading(msg);
                 console.error(err);
            })
            .then(function(data) {
                if (data && !data.error && options.delayAmount > 0) {
                    //start the timer
                    require(["jquery-growl"], function() { $.growl.warning({ message: instrumentName + ' feed is delayed by '.i18n() + options.delayAmount + ' minutes'.i18n() }); });
                    chartingRequestMap[key].timerHandler = setInterval(function() {
                      var lastBar = barsTable.chain()
                                              .find({instrumentCdAndTp : key})
                                              .simplesort('time', true)
                                              .limit(1)
                                              .data();
                      if (lastBar && lastBar.length > 0) {
                          lastBar = lastBar[0];
                          //requests new bars
                          //Send the WS request
                          var requestObject = {
                              "ticks_history": instrumentCode,
                              "end": 'latest',
                              //"count": count,
                              "start": (lastBar.time/1000) | 0,
                              "granularity":  convertToTimeperiodObject(timePeriod).timeInSeconds()
                          };
                          liveapi.send(requestObject);
                      }
                    }, 60*1000);
                }
            });

            chartingRequestMap[key].chartIDs.push({
                        containerIDWithHash : containerIDWithHash,
                        series_compare : series_compare,
                        instrumentCode : instrumentCode,
                        instrumentName : instrumentName
            });
            return done_promise;
        }
    };

});
