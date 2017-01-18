/**
 * Created by arnab on 2/12/15.
 */

define(["jquery", "jquery-ui", "websockets/binary_websockets", "navigation/menu", "charts/chartWindow", "jquery-growl","common/util"],
    function ($, $ui, liveapi, menu, chartWindow) {

    "use strict";
    function refresh_active_symbols() {
        liveapi
            .send({ active_symbols: 'brief' })
            .then(function (data) {
              var active_symbols = [];
              var active_markets = _(data.active_symbols).groupBy('market').map(function(symbols) {
                  var sym = _.head(symbols);
                  var market = { name: sym.market, display_name: sym.market_display_name };
                  market.submarkets = _(symbols).groupBy('submarket').map(function(symbols) {
                    var sym = _.head(symbols);
                    var submarket = { name: sym.submarket, display_name: sym.submarket_display_name };
                    submarket.instruments = _.map(symbols, function(sym){
                        active_symbols.push(sym.symbol);
                        return  {
                          symbol: sym.symbol,
                          display_name: sym.display_name,
                        };
                      });
                    return submarket;
                  }).value();
                  return market;
              }).value();
              markets = chartable_markets.map(function(m) {
                return {
                  display_name: m.display_name,
                  name: m.name,
                  submarkets: m.submarkets.map(function(sm) {
                    return {
                      display_name: sm.display_name,
                      instruments: sm.instruments.filter(function(ins) {
                        return active_symbols.indexOf(ins.symbol) !== -1;
                      })
                    }
                  }).filter(function(sm) { return sm.instruments.length !== 0; })
                }
              }).filter(function(m) { return m.submarkets.length !== 0; });

              //console.warn(markets, chartable_markets);
              markets = menu.sortMenu(markets);

              var instruments = $("#nav-menu").find(".instruments");
              instruments.find('> ul').remove();
              var root = $("<ul>").appendTo(instruments); /* add to instruments menu */
              menu.refreshMenu(root, markets, onMenuItemClick);
            });
    }

    function onMenuItemClick(li) {

        var delayAmount = li.data('delay_amount'), //this is in minutes
            symbol = li.data('symbol'),
            displaySymbol = li.data('display_name');

        chartWindow.addNewWindow({
            instrumentCode : symbol,
            instrumentName : displaySymbol,
            timePeriod : '1d',
            type : 'candlestick',
            delayAmount : delayAmount
        });

    }

    var markets = [];
    var chartable_markets = [];

    return {
        init: function() {
            /* cache the result of trading_times call, because assetIndex needs the same data */
            return liveapi
                .cached.send({ trading_times: new Date().toISOString().slice(0, 10) })
                .then(function (data) {
                    chartable_markets = menu.extractChartableMarkets(data);
                    refresh_active_symbols();
                    require(['websockets/binary_websockets'],function(liveapi) {
                      liveapi.events.on('login', refresh_active_symbols);
                      liveapi.events.on('logout', refresh_active_symbols);
                    });
                    /* refresh menu on mouse leave */
                    var instruments = $("#nav-menu").find(".instruments").on('mouseleave', refresh_active_symbols);
                    return chartable_markets;
                });
        },

        getMarketData : function() {
            return markets;
        },

        isMarketDataPresent : function( marketDataDisplayName, marketData ) {
            var present = false;
            if (!marketData) {
                marketData = markets;
            }

            var instrumentObj = this;
            $.each(marketData, function (key, value) {
                if (value.submarkets || value.instruments) {
                    present = instrumentObj.isMarketDataPresent(marketDataDisplayName, value.submarkets || value.instruments);
                } else {
                    if ($.trim(value.display_name) == $.trim(marketDataDisplayName)) {
                        present = true;
                    }
                }
                return !present;
            });
            return present;
        },

        getSpecificMarketData : function( marketDataDisplayName, marketData ) {
            var present = {};
            if (!marketData) {
                marketData = markets;
            }

            var instrumentObj = this;
            $.each(marketData, function (key, value) {
                if (value.submarkets || value.instruments) {
                    present = instrumentObj.getSpecificMarketData(marketDataDisplayName, value.submarkets || value.instruments);
                } else {
                    if ($.trim(value.display_name) == $.trim(marketDataDisplayName)) {
                        present = value;
                    }
                }
                return $.isEmptyObject(present);
            });
            return present;
        }
    };

});
