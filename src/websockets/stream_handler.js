define(['jquery', "websockets/binary_websockets", "charts/chartingRequestMap", "common/util"], function ($, liveapi, chartingRequestMap) {

    var barsTable = chartingRequestMap.barsTable;

    function setExtremePointsForXAxis(chart, startTime, endTime) {
        chart.xAxis.forEach(function (xAxis) {
            if (!startTime) startTime = xAxis.getExtremes().min;
            if (!endTime) endTime = xAxis.getExtremes().max;
            xAxis.setExtremes(startTime, endTime);
        });
    }

    liveapi.events.on('tick', function (data) {
        var key = data.echo_req.ticks_history + data.echo_req.granularity;
        if (key && chartingRequestMap[key.toUpperCase()]) {
            key = key.toUpperCase();

            var price = parseFloat(data.tick.quote);
            var time = parseInt(data.tick.epoch) * 1000;

            var chartingRequest = chartingRequestMap[key];
            var granularity = data.echo_req.granularity || 0;
            chartingRequest.id = chartingRequest.id || data.tick.id;

            if(granularity === 0) {
                var tick = {
                  instrumentCdAndTp: key,
                  time: time,
                  open: price,
                  high: price,
                  low: price,
                  close: price,
                  /* this will be used from trade confirmation dialog */
                  price: data.tick.quote, /* we need the original value for tick trades */
                }
                barsTable.insert(tick);
                /* notify subscribers */
                var preTick = tick;
                var bars = barsTable.chain()
                          .find({ instrumentCdAndTp: key })
                          .simplesort('time', true)
                          .limit(2).data();
                if (bars.length > 1)
                    preTick = bars[1];
                fire_event('tick', { tick: tick, key: key, preTick: preTick });

                if (!(chartingRequest.chartIDs && chartingRequest.chartIDs.length > 0)) {
                    return;
                }
                //notify all registered charts
                chartingRequest.chartIDs.forEach(function (chartID) {
                    var chart = $(chartID.containerIDWithHash).highcharts();
                    if (!chart) return;

                    var series = chart.get(key);
                    if (!series) return;

                    series.addPoint([time, price]);
                    //setExtremePointsForXAxis(chart, time);

                });

            }

        }
    });

    liveapi.events.on('ohlc', function (data) {
        var key = data.ohlc.symbol + data.ohlc.granularity;
        if (key && chartingRequestMap[key.toUpperCase()]) {
            key = key.toUpperCase();
            // TODO: 1-consume this notification 2-do not use global notifications, use a better approach.
            $(document).trigger("feedTypeNotification", [key, "realtime-feed"]);

            var open = parseFloat(data.ohlc.open);
            var high = parseFloat(data.ohlc.high);
            var low = parseFloat(data.ohlc.low);
            var close = parseFloat(data.ohlc.close);
            var time = parseInt(data.ohlc.open_time) * 1000;

            var chartingRequest = chartingRequestMap[key];
            chartingRequest.id = chartingRequest.id || data.ohlc.id;
            if (!(chartingRequest.chartIDs && chartingRequest.chartIDs.length > 0))
                return;
            var timePeriod = $(chartingRequest.chartIDs[0].containerIDWithHash).data('timePeriod');
            if (!timePeriod)
                return;

            var bar = barsTable.chain()
                .find({ '$and': [{instrumentCdAndTp: key}, {time : time}] })
                .simplesort("time", true)
                .limit(1)
                .data();
            var isNew = false;
            if (!bar || bar.length <= 0) {
                bar = {
                    instrumentCdAndTp: key,
                    time: time,
                    open: open,
                    high: high,
                    low: low,
                    close: close
                };
                barsTable.insert(bar);
                isNew = true;
            } else {
                bar = bar[0];
                bar.open = open;
                bar.high = high;
                bar.low = low;
                bar.close = close;
                barsTable.update(bar);
            }
            
            var preOhlc = bar;
            var bars = barsTable.chain()
                .find({ instrumentCdAndTp: key })
                .simplesort('time', true)
                .limit(2).data();
            if (bars.length > 1)
                preOhlc = bars[1];
            /* notify subscribers */
            fire_event('ohlc', { ohlc: bar, is_new: isNew, key: key, preOhlc: preOhlc });

            //notify all registered charts
            chartingRequest.chartIDs.forEach(function (chartID) {

                var chart = $(chartID.containerIDWithHash).highcharts();
                if (!chart) return;

                var series = chart.get(key);
                if (!series) return;

                var type = $(chartID.containerIDWithHash).data('type');

                var last = series.data[series.data.length - 1];
                if (series.options.data.length != series.data.length) {
                    //TODO - This is an error situation
                    setExtremePointsForXAxis(chart, null, bar.time);
                    return;
                }

                if (type && isDataTypeClosePriceOnly(type)) {//Only update when its not in loading mode
                    if (isNew) {
                        series.addPoint([time, close], true, true, false);
                    } else {
                        last.update({
                            y : close
                        });
                    }
                } else {
                    if (isNew) {
                        series.addPoint([time, open, high, low, close], true, true, false);
                    } else {
                        last.update({
                            open : open,
                            high : high,
                            low : low,
                            close : close
                        });
                    }
                }
            });

        }
    });

    var callbacks = { };
    /* fire a custom event and call registered callbacks(api.events.on(name)) */
    var fire_event = function(name /*, args */){
      var args = [].slice.call(arguments,1);
      var fns = callbacks[name] || [];
      fns.forEach(function (cb) {
          setTimeout(function(){
            cb.apply(undefined, args);
          },0);
      });
    };

    return {
        events: {
            on: function (name, cb) {
                (callbacks[name] = callbacks[name] || []).push(cb);
                return cb;
            },
            off: function(name, cb){
                if(callbacks[name]) {
                  var index = callbacks[name].indexOf(cb);
                  index !== -1 && callbacks[name].splice(index, 1);
                }
            }
        },
    };
});
