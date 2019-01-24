const getMarketsSubmarkets = (active_symbols) => {
    console.log(getOrderedMarkets(active_symbols));
    const select_market_submarket = active_symbols.reduce((market_result, markets) => {
        const { market, market_display_name, submarket_display_name, display_name } = markets;

        market_result[market_display_name] = market_result[market_display_name] || {};
        market_result[market_display_name][submarket_display_name] = market_result[market_display_name][submarket_display_name] || [];
        market_result[market_display_name][submarket_display_name].push(display_name);
 
        return market_result;
    }, {})
 
    return select_market_submarket
 }

 const getOrderedMarkets = (active_symbols) => active_symbols
    .map((symbol) => ({
        [symbol.market]: symbol.market_display_name
    }))
    .reduce((market_result, markets) => {
        return markets || {};
    }, {});

 const getMarketsId = (active_symbols) => active_symbols
    .map(symbol => symbol.market)
    .filter((markets, index, self) => self
    .indexOf(markets) === index);

 const market_order = {
    forex      : 1,
    volidx     : 2,
    indices    : 3,
    stocks     : 4,
    commodities: 5,
};

const getMarketsOrder = market => market_order[market] || 100;

const getSortedMarkets = (markets) => markets.sort((a, b) => getMarketsOrder(a) - getMarketsOrder(b));

export { getMarketsSubmarkets,
         getSortedMarkets,
         getMarketsId,
         getMarketsOrder };