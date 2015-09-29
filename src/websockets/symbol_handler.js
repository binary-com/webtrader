define([], function() {
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
	var markets = [];
	var callBacksWhenMarketsIsLoaded = [];
	var requestSubmitted = false;
	return {
		
		process : function(data) {
			requestSubmitted = false;
			
			for (var marketIndex in data.trading_times.markets) {
			    var marketFromResponse = data.trading_times.markets[marketIndex];
			    var market = {
			      name : marketFromResponse.name, 
			      display_name : marketFromResponse.name,
			      submarkets : []
			    };

			    for (var submarketIndxx in marketFromResponse.submarkets) {
			      var submarket = marketFromResponse.submarkets[submarketIndxx];
			      var submarketObj = {
			        name : submarket.name,
			        display_name : submarket.name,
			        instruments : []
			      };
			      for (var eachSymbolIndx in submarket.symbols) {
			        var eachSymbol = submarket.symbols[eachSymbolIndx];
			        submarketObj.instruments.push({
			          symbol : eachSymbol.symbol,
			          display_name : eachSymbol.name,
			          delay_amount : 0 //TODO fix this when API provides it
			        });
			      }

			      market.submarkets.push(submarketObj);
			    }

			    markets.push(market);
		  	}

			for (var index in callBacksWhenMarketsIsLoaded) {
				callBacksWhenMarketsIsLoaded[index](markets);
			}
			callBacksWhenMarketsIsLoaded = [];
		},

		fetchMarkets : function(callBack) {
			if (callBack) 
			{
				callBacksWhenMarketsIsLoaded.push(callBack);
			}
			if (!requestSubmitted) {
				require(['websockets/eventSourceHandler'], function(eventSourceHandler) {
					eventSourceHandler.retrieveInstrumentList();
				});
				requestSubmitted = true;
			}
		}

	};
});
