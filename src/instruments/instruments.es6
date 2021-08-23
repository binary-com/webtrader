import $ from "jquery";
import liveapi from "websockets/binary_websockets";
import menu from "navigation/menu";
import chartWindow from "charts/chartWindow";
import { getSortedMarketSubmarkets } from '../common/marketUtils';
import "jquery-growl";
import "common/util";

const get_active_symbol = (landing_company, country) => {

    liveapi
        .send({ active_symbols: 'brief' })
        .then(function(data) {
            const active_symbols = [];
            let filtered_symbols;
    
            local_storage.set('active_symbols', data.active_symbols);

            const active_markets = _(data.active_symbols).groupBy('market').map(function (symbols) {
                const filtered_symbols = symbols;
                const sym = _.head(filtered_symbols);
                const market = { name: sym.market, display_name: sym.market_display_name };
                market.submarkets = _(filtered_symbols).groupBy('submarket').map(function (symbols) {
                    const sym = _.head(symbols);
                    const submarket = { name: sym.submarket, display_name: sym.submarket_display_name };
                    submarket.instruments = _.map(symbols, function (sym) {
                        active_symbols.push(sym.symbol);
                        return {
                            symbol: sym.symbol,
                            display_name: sym.display_name,
                        };
                    });
                    return submarket;
                }).value();
                return market;
            }).value();
            markets = chartable_markets.map(function (m) {
                return {
                    display_name: m.display_name,
                    name: m.name,
                    submarkets: m.submarkets.map(function (sm) {
                        return {
                            display_name: sm.display_name,
                            instruments: sm.instruments.filter(function (ins) {
                                return active_symbols.indexOf(ins.symbol) !== -1;
                            })
                        }
                    }).filter(function (sm) {
                        return sm.instruments.length !== 0;
                    })
                }
            }).filter(function (m) {
                return m.submarkets.length !== 0;
            });
            markets = getSortedMarketSubmarkets(active_markets);
            const instruments = $("#nav-menu").find(".instruments");
            instruments.find('> ul').remove();
            menu.refreshMenu(instruments, markets, onMenuItemClick);
        })
        .catch((err) => {
            $.growl.error({ message: err.message });
        });
}

function refresh_active_symbols() {
    if (local_storage.get('oauth')) {
        liveapi
        .cached
        .authorize()
        .then(() => {
            const country = local_storage.get('authorize').country;
            liveapi
            .cached
            .send({ landing_company: country })
            .then((data) => {
               const landing_company = data.landing_company
               get_active_symbol(landing_company, country);
            });
        })
        .catch((err) => {
            $.growl.error({ message: err.message });
         });
    } else {
        get_active_symbol();
    }
}

function onMenuItemClick(symbol, displayName) {
    chartWindow.addNewWindow({
        instrumentCode: symbol,
        instrumentName: displayName,
        timePeriod: '1d',
        type: 'candlestick'
    });
}

let markets = [];
let chartable_markets = [];

export const init = function () {
    return liveapi
        .cached.send({ trading_times: new Date().toISOString().slice(0, 10) })
        .then(function (data) {
            chartable_markets = menu.extractChartableMarkets(data);
            refresh_active_symbols();
            liveapi.events.on('login', refresh_active_symbols);
            liveapi.events.on('logout', refresh_active_symbols);

            return chartable_markets;
        });
}

export const getMarketData = function () {
    return markets;
}

export const isMarketDataPresent = function (marketDataDisplayName, marketData) {
    let present = false;
    if (!marketData) {
        marketData = markets;
    }

    const instrumentObj = this;
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
}

export const getSpecificMarketData = function (marketDataDisplayName, marketData) {
    let present = {};
    if (!marketData) {
        marketData = markets;
    }

    const instrumentObj = this;
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

export default {
    init,
    getMarketData,
    isMarketDataPresent,
    getSpecificMarketData
}
