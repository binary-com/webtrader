define(["websockets/binary_websockets", "charts/chartingRequestMap", "common/util"], function (liveapi, chartingRequestMap) {

    var barsTable = chartingRequestMap.barsTable;
    liveapi.events.on('tick', function (data) {
        if (data.error) {
            // TODO: 1-consume this notification 2-do not use global notifications, use a better approach.
            $(document).trigger("feedTypeNotification", [key, "delayed-feed"]);
            console.error(data.error); // TODO: can we recover?
            return;
        }

        var key = data.echo_req.passthrough.instrumentCdAndTp;
        if (key) {
            chartingRequestMap[key] = chartingRequestMap[key] || {};
            chartingRequestMap[key].tickStreamingID = data.tick.id;

            // TODO: 1-consume this notification 2-do not use global notifications, use a better approach.
            $(document).trigger("feedTypeNotification", [key, "realtime-feed"]);

            var price = parseFloat(data.tick.quote);
            var time = parseInt(data.tick.epoch) * 1000;
            tickReceived(key, time, price);
        }
    });

    function tickReceived(key, time, price) {
        var chartingRequest = chartingRequestMap[key];
        if (!(chartingRequest.chartIDs && chartingRequest.chartIDs.length > 0))
            return;
        var timeperiod = $(chartingRequest.chartIDs[0].containerIDWithHash).data('timeperiod');
        if (!timeperiod)
            return;

        var bar = null;
        if (isTick(timeperiod)) { //Update OHLC with same value in DB

            barsTable.insert({
                instrumentCdAndTp: key,
                time: time,
                open: price,
                high: price,
                low: price,
                close: price
            });
        }
        else { //Just update high/low/close price in DB as necessary
            bar = barsTable.chain()
                            .find({ instrumentCdAndTp: key })
                            .simplesort("time", true)
                            .limit(1)
                            .data();
            if (!bar || bar.length <= 0) {
                console.error('There are no bars in barsTable for instrumentCdAndTp : ' + key);
                return;
            }
            bar = bar[0];
            bar.close = Math.min(Math.max(price, bar.low), bar.high);
            barsTable.update(bar);
        }

        //notify all registered charts
        chartingRequest.chartIDs.forEach(function (chartID) {
            var chart = $(chartID.containerIDWithHash).highcharts();
            if (!chart) return;

            var series = chart.get(key);
            if (!series) return;

            if (isTick(timeperiod)) {
                series.addPoint([time, price]);
                return;
            }

            var type = $(chartID.containerIDWithHash).data('type');
            var last = series.data[series.data.length - 1];

            if (type && isDataTypeClosePriceOnly(type)) //Only update when its not in loading mode
                last.update([last.x, price]);
            else if (bar)
                last.update([last.x, bar.open, bar.high, bar.low, bar.close]);
        });
    }

    return {};
});