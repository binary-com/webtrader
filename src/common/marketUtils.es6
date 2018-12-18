const getMarketsSubmarkets = (active_symbols) => {
    const select_market_submarket = active_symbols.reduce((market_result, market) => {
        const { market_display_name, submarket_display_name, display_name } = market;
 
        market_result[market_display_name] = market_result[market_display_name] || {};
        market_result[market_display_name][submarket_display_name] = market_result[market_display_name][submarket_display_name] || [];
        market_result[market_display_name][submarket_display_name].push(display_name);
 
        return market_result;
    }, {})
 
    return select_market_submarket
 }

export default getMarketsSubmarkets;