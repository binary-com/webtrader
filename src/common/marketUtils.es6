const sortMarkets = (() => {
    const market_order = {
        forex: 1,
        indices: 2,
        commodities: 3,
        volidx: 4,
    };

    return function sortMarkets(markets) {
        return markets.sort((a, b) => market_order[typeof a === 'object' ? a.name : a] - market_order[typeof b === 'object' ? b.name : b]);
    };
})();

const sortSubmarkets = ([...markets]) => {
    return markets.map((market) => {
        if (market.submarkets) {
            const submarkets_sort = market.submarkets.sort((a, b) => {
                if (a.display_name < b.display_name) return -1;
                if (a.display_name > b.display_name) return 1;
            });
            market.submarkets = submarkets_sort;
        }
        return market
    })
}

const getSortedMarkets = (active_symbols) => {
    const unsorted_markets = active_symbols.reduce((market_result, markets) => {
        const { market, market_display_name } = markets;

        market_result[market] = market_result[market] || [];
        if (market_result[market].includes(market_display_name) === false) market_result[market].push(market_display_name);

        return market_result;
    }, {});

    const sorted_markets_order = sortMarkets(Object.keys(unsorted_markets));

    return sorted_markets_order.map(market_id => unsorted_markets[market_id].toString());
};

function getSortedSubmarkets([...submarkets]) {
    return submarkets.sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
    })
}

const getObjectMarketSubmarkets = (active_symbols) => {
    return active_symbols.reduce((market_result, markets) => {
        const { market_display_name, submarket_display_name, display_name } = markets;

        market_result[market_display_name] = market_result[market_display_name] || {};
        market_result[market_display_name][submarket_display_name] = market_result[market_display_name][submarket_display_name] || [];
        market_result[market_display_name][submarket_display_name].push(display_name);

        return market_result;
    }, {});
};

const getSortedMarketSubmarkets = (markets_submarkets) => {
    const sorted_markets_order = sortMarkets(markets_submarkets);
    const sorted_market_child = sortSubmarkets(sorted_markets_order);

    return sorted_market_child
}

export {
    getObjectMarketSubmarkets,
    getSortedMarkets,
    getSortedMarketSubmarkets,
    getSortedSubmarkets,
};