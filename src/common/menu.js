/**
 * Created by amin on October 30, 2015.
 */

define(['jquery', 'common/util'], function ($) {

    function sortMarkets(data) {
        if($.isArray(data)) {
            data.sort(sortAlphaNum('display_name'));

            // iterate array items.
            $.each(data, function (i, item) {
                // iterame item properties.
                $.each(item, function (i, prop) {
                    if($.isArray(prop)) {
                        sortMarkets(prop);
                    }
                });
            });
        }
        return data;
    }

    return {
        extractMenu: function (trading_times_data) {
            var markets = trading_times_data.trading_times.markets.map(function (m) {
                var market = {
                    name: m.name,
                    display_name: m.name
                };
                market.submarkets = m.submarkets.map(function (sm) {
                    var submarket = {
                        name: sm.name,
                        display_name: sm.name
                    };
                    submarket.instruments = sm.symbols.map(function (sym) {
                        return {
                            symbol: sym.symbol,
                            display_name: sym.name,
                            delay_amount: sym.delay_amount
                        };
                    });
                    return submarket;
                });
                return market;
            });

            return markets;
        },

        sortMenu: sortMarkets
    }
});
