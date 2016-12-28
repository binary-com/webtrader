/**
 * Created by arnab on 2/12/15.
 */

define(["jquery", "jquery-ui", "websockets/binary_websockets", "navigation/menu", "charts/chartWindow", "jquery-growl","common/util"],
    function ($, $ui, liveapi, menu, chartWindow) {

    "use strict";

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

    return {
        init: function() {
            /* cache the result of trading_times call, because assetIndex needs the same data */
            return liveapi
                    .cached.send({ trading_times: new Date().toISOString().slice(0, 10) })
                    .then(function (data) {
                        markets = menu.extractChartableMarkets(data);
                        if ($("#nav-menu").length > 0) {
                            var rootUL = $("<ul>").appendTo($("#nav-menu").find(".instruments"));
                            /* add to instruments menu */
                            markets = menu.sortMenu(markets);
                            menu.refreshMenu(rootUL, markets, onMenuItemClick);
                        }
                        return markets;
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
