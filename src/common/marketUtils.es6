const getMarketPosition = (markets) => {
    const market_order = {
        forex: 1,
        indices: 2,
        commodities: 3,
        volidx: 4,
    };
    
    return markets.sort((a, b) => market_order[a] - market_order[b]);
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

export {
    getMarketsSubmarkets,
    getOrderedMarkets,
};