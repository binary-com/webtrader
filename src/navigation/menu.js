/**
 * Created by amin on October 30, 2015.
 */

define(['jquery', 'navigation/navigation', 'lodash', 'common/util'], function ($, navigation, _) {
    'use strict';

    /* recursively creates menu into root element, set on_click to register menu item clicks */
    function refreshMenu( root, data , on_click) {

        data.forEach(function (value) {
            var isDropdownMenu = value.submarkets || value.instruments;
            var caretHtml = "<span class='nav-submenu-caret'></span>";
            var menuLinkHtml = isDropdownMenu ? value.display_name + caretHtml : value.display_name;
            var $menuLink = $("<a href='#'>" + menuLinkHtml + "</a>");
            if(value.is_disabled)  $menuLink.addClass('disabled');

            var newLI = $("<li>").append($menuLink);
            if(!isDropdownMenu) {
                newLI.data(value); /* example use => newLI.data('symbol'), newLI.data('delay_amount'), newLI.data('display_name') */
            }
            newLI.appendTo( root);

            if (isDropdownMenu) {
                var newUL = $("<ul>");
                newUL.appendTo(newLI);
                refreshMenu( newUL, value.submarkets || value.instruments, on_click );
            }
            else if(on_click && !value.is_disabled)
                $menuLink.click(function () {
                    /* pass the <li> not the <a> tag */
                    var li = $(this).parent();
                    on_click(li);
                });
        });
    }

    return {
        /* you can filter the symbols with the options parameter, for example:
            options: {
                filter: function(sym) { return sym.feed_license !== 'realtime'; }
            }
        }*/
        extractChartableMarkets: function(trading_times_data) {
            return this.extractFilteredMarkets(trading_times_data, {
                            filter: function (sym) { return sym.feed_license !== 'chartonly'; }
                        }) || [];
        },
        extractFilteredMarkets: function (trading_times_data, options) {
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
                    var symbols = sm.symbols;
                    if (options && options.filter) /* filter the symbols */
                        symbols = symbols.filter(options.filter);
                    submarket.instruments = symbols.map(function (sym) {
                        return {
                            symbol: sym.symbol,
                            display_name: sym.name,
                            delay_amount: sym.delay_amount || 0,
                            events: sym.events,
                            times: sym.times,
                            settlement: sym.settlement,
                            feed_license: sym.feed_license || 'realtime'
                        };
                    });
                    return submarket;
                })
                /* there might be a submarket (e.g "Americas") which does not have any symbols after filtering */
                .filter(function (sm) {
                    return sm.instruments.length > 0;
                });
                return market;
            });

            return markets;
        },

        sortMenu: function(markets) {
            var sort_fn = sortAlphaNum('display_name');
            //Sort market
            if($.isArray(markets)) {

                var rank = { "forex": 1, "indices": 2, "stocks": 3, "commodities": 4, "volidx": 5 };
                markets = _.sortBy(markets, function(o) {
                    return rank[o.name.toLowerCase()];
                });
                markets.forEach(function (market) {
                    if($.isArray(market.submarkets)) {
                        // Sort sub-markets
                        market.submarkets.sort(sort_fn);
                        market.submarkets.forEach(function (submarket) {
                            if($.isArray(submarket.instruments)) {
                                // Sort instruments
                                submarket.instruments.sort(sort_fn);
                            }
                        });
                    }
                });
            }
            return markets;
        },

        refreshMenu: function (root,data,on_click) {
            refreshMenu(root, data, on_click);
            navigation.updateDropdownToggles();
        }
    }
});
