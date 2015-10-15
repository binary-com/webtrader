define(['jquery','websockets/eventSourceHandler'], function($,liveapi) {
	/*
		random: {
			submarkets : [
				{
					instruments: [
						{
							"symbol": "R_100",
                			"feed_license": "realtime",
                			"delay_amount": "0",
                			"display_name": "Random 100 Index"
                		},
						{}
					],
		            "name": "random_index",
		            "display_name": "Indices"
				},
				{}
			],
	        "name": "random",
	        "display_name": "Randoms"
		},
		{}
	*/
    // the callback list can only be fired once.(TODO: make this a unitlity)
    var callBacksWhenMarketsIsLoaded = {
        list: [],
        add: function (callback) {
            $.type(callback) == "function" && this.list.push(callback);
        },
        fire: function () {
            while (this.list.length > 0)
                this.list.shift().apply(this, arguments);
        }
    };
	var requestSubmitted = false;
	return {
		
		process : function(data) {
			requestSubmitted = false;
			callBacksWhenMarketsIsLoaded.fire(data);
		},

		fetchMarkets : function(callBack) {
		    callBack && callBacksWhenMarketsIsLoaded.add(callBack);
			if (!requestSubmitted) {
			    liveapi.getTradingTimes(new Date()).then(this.process);
				//require(['websockets/eventSourceHandler'], function(eventSourceHandler) {
				//    eventSourceHandler.apicall.trading_times(new Date().toISOString().slice(0, 10));
				//});
				requestSubmitted = true;
			}
		}

	};
});
