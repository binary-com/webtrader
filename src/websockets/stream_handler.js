define(["websockets/binary_websockets", "charts/chartingRequestMap", "common/util"], function (liveapi, chartingRequestMap) {

    var barsTable = chartingRequestMap.barsTable;

    function setExtremePointsForXAxis(chart, startTime, endTime) {
        chart.xAxis.forEach(function (xAxis) {
            console.log(xAxis);
            if (!startTime) startTime = xAxis.getExtremes().min;
            if (!endTime) endTime = xAxis.getExtremes().max;
            xAxis.setExtremes(startTime, endTime);
        });
    }

    liveapi.events.on('tick', function (data) {
        var key = data.echo_req.ticks_history + data.echo_req.granularity;
        if (key) {
            key = key.toUpperCase();
            chartingRequestMap[key] = chartingRequestMap[key] || {};

            // TODO: 1-consume this notification 2-do not use global notifications, use a better approach.
            $(document).trigger("feedTypeNotification", [key, "realtime-feed"]);

            var price = parseFloat(data.tick.quote);
            var time = parseInt(data.tick.epoch) * 1000;

            var chartingRequest = chartingRequestMap[key];
            if (!(chartingRequest.chartIDs && chartingRequest.chartIDs.length > 0))
                return;
            var timePeriod = $(chartingRequest.chartIDs[0].containerIDWithHash).data('timePeriod');
            if (!timePeriod)
                return;

            if (isTick(timePeriod)) { //Update OHLC with same value in DB

                barsTable.insert({
                    instrumentCdAndTp: key,
                    time: time,
                    open: price,
                    high: price,
                    low: price,
                    close: price
                });

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
        var key = data.echo_req.ticks_history + data.echo_req.granularity;
        if (key) {
            key = key.toUpperCase();
            chartingRequestMap[key] = chartingRequestMap[key] || {};

            // TODO: 1-consume this notification 2-do not use global notifications, use a better approach.
            $(document).trigger("feedTypeNotification", [key, "realtime-feed"]);

            var open = parseFloat(data.ohlc.open);
            var high = parseFloat(data.ohlc.high);
            var low = parseFloat(data.ohlc.low);
            var close = parseFloat(data.ohlc.close);
            var time = parseInt(data.ohlc.open_time) * 1000;

            var chartingRequest = chartingRequestMap[key];
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

            //notify all registered charts
            chartingRequest.chartIDs.forEach(function (chartID) {

                var chart = $(chartID.containerIDWithHash).highcharts();
                if (!chart) return;

                var series = chart.get(key);
                if (!series) return;

                var type = $(chartID.containerIDWithHash).data('type');

                var last = series.data[series.data.length - 1];
                console.log(bar.time, last.time, series.options.data.length, series.data.length, series.points.length);
                if (series.options.data.length != series.data.length) {
                    //TODO - This is an error situation
                    setExtremePointsForXAxis(chart, null, bar.time);
                    return;
                }
                console.log('Series data length : ', series.options.name, series.data.length);

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
                        console.log('Inserting : ', [time, open, high, low, close]);
                        series.addPoint([time, open, high, low, close], true, true, false);
                    } else {
                        console.log('Updating : ', last);
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

    return {};
});
