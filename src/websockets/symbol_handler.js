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
	var callBacksWhenMarketsIsLoaded = $.Callbacks('once'); // the callback list can only be fired once.
	var requestSubmitted = false;
	return {
		
		process : function(data) {
			requestSubmitted = false;

			callBacksWhenMarketsIsLoaded.fire(data);
		},

		fetchMarkets : function(callBack) {
		    callBack && callBacksWhenMarketsIsLoaded.add(callBack);
			if (!requestSubmitted) {
				require(['websockets/eventSourceHandler'], function(eventSourceHandler) {
				    eventSourceHandler.apicall.trading_times(new Date().toISOString().slice(0, 10));
				});
				requestSubmitted = true;
			}
		}

	};
});
