const market_order = {
    forex: 1,
    indices: 2,
    commodities: 3,
    volidx: 4,
};

const getSortedMarkets = (markets) => markets.sort((a, b) => getMarketsOrder(a) - getMarketsOrder(b));

const getMarketsSubmarkets = (active_symbols) => {
    return active_symbols.reduce((market_result, markets) => {
        const { market_display_name, submarket_display_name, display_name } = markets;

        market_result[market_display_name] = market_result[market_display_name] || {};
        market_result[market_display_name][submarket_display_name] = market_result[market_display_name][submarket_display_name] || [];
        market_result[market_display_name][submarket_display_name].push(display_name);

        return market_result;
    }, {});
};

const getDefaultMarkets = (active_symbols) => {
    const unsorted_markets = getOrderedMarkets(active_symbols);
    const sorted_markets_order = getSortedMarkets(Object.keys(unsorted_markets));

    return sorted_markets_order.map(market_id => unsorted_markets[market_id].toString());
};

const getOrderedMarkets = (active_symbols) => {
    return active_symbols.reduce((market_result, markets) => {
        const { market, market_display_name } = markets;

        market_result[market] = market_result[market] || [];
        if (market_result[market].includes(market_display_name) === false) market_result[market].push(market_display_name);

        return market_result;
    }, {});
};

const getMarketsOrder = market => market_order[market] || 100;

export {
    getMarketsSubmarkets,
    getDefaultMarkets,
    getMarketsOrder
};