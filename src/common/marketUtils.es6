const getMarketPosition = (() => {
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

const getMarketChild = ([...markets]) => {
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

const getMarketChildSorted = (markets) => {
    const sorted_markets_order = getMarketPosition(markets);
    const sorted_market_child = getMarketChild(sorted_markets_order);

    return sorted_market_child
}

const getMarketsSubmarkets = (active_symbols) => {
    return active_symbols.reduce((market_result, markets) => {
        const { market_display_name, submarket_display_name, display_name } = markets;

        market_result[market_display_name] = market_result[market_display_name] || {};
        market_result[market_display_name][submarket_display_name] = market_result[market_display_name][submarket_display_name] || [];
        market_result[market_display_name][submarket_display_name].push(display_name);

        return market_result;
    }, {});
};

const getOrderedMarkets = (active_symbols) => {
    const unsorted_markets = getMarkets(active_symbols);
    const sorted_markets_order = getMarketPosition(Object.keys(unsorted_markets));

    return sorted_markets_order.map(market_id => unsorted_markets[market_id].toString());
};

const getMarkets = (active_symbols) => {
    return active_symbols.reduce((market_result, markets) => {
        const { market, market_display_name } = markets;

        market_result[market] = market_result[market] || [];
        if (market_result[market].includes(market_display_name) === false) market_result[market].push(market_display_name);

        return market_result;
    }, {});
};

function sortSubmarkets([...submarkets]) {
    return submarkets.sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
    })
}

export {
    getMarketsSubmarkets,
    getOrderedMarkets,
    getMarketChildSorted,
    sortSubmarkets,
};