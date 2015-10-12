define(['jquery'], function($) {
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

        /* @param: yyyy_mm_dd  #optional */
		fetchMarkets : function(callBack, yyyy_mm_dd) {
		    callBack && callBacksWhenMarketsIsLoaded.add(callBack);
			if (!requestSubmitted) {
				require(['websockets/eventSourceHandler'], function(eventSourceHandler) {
				    yyyy_mm_dd = yyyy_mm_dd || new Date().toISOString().slice(0, 10);
				    eventSourceHandler.apicall.trading_times(yyyy_mm_dd);
				});
				requestSubmitted = true;
			}
		}

	};
});
