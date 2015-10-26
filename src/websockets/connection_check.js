define(["websockets/binary_websockets","charts/chartingRequestMap"], function(liveapi,chartingRequestMap) {
    //Ping server every 15 seconds
	var lastUpdateTime = null;
    $(document).everyTime(15000, null, function() {
        var difference = new Date().getTime() - (lastUpdateTime || new Date().getTime());
        console.log('Time difference in ms for ping thread execution : ', difference);
        if (difference >= 60000) {
            //Code coming here means we have not got update for past 1 minutes
            //Probably the connection is lost. We have to re-establish WS connection and subscribe to all tick streaming
            if (chartingRequestMap) {
                $.each(chartingRequestMap, function(key, value) {

                    var chartIDs = value.chartIDs;
                    liveapi.send({"forget" : chartingRequestMap[key].tickStreamingID});
                    chartingRequestMap[key].tickStreamingID = null;

                    if (chartIDs && chartIDs.length > 0) {
                        //Send the WS request
                        var requestObject = {
                            "ticks": chartIDs[0].instrumentCode,
                            "end": 'latest',
                            "passthrough": {
                                "instrumentCdAndTp" : key.toUpperCase()
                            }
                        };
                        console.log('Resubscribing : ', JSON.stringify(requestObject));
                        liveapi.send(requestObject);
                    }

                });
            }
        } else {
            liveapi.send({"ping" : "1"});
        }
    });

    liveapi.events.on('ping', function () {
        console.log('Server ponged!');
        lastUpdateTime = new Date().getTime();
    })
	return { };
});
