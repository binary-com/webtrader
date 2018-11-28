import $ from 'jquery';
import windows from '../windows/windows';
import liveapi from '../websockets/binary_websockets';
import menu from '../navigation/menu';
import rv from 'common/rivetsExtra';
import 'jquery-growl';
import 'css!./assetIndex.css';

let table = null;
let assetWin = null;
let header = null;
let dialog_buttons = null;

export const init = (li) => {
    li.click(() => {
        if (!assetWin) {
            assetWin = windows.createBlankWindow($('<div/>'), {
                title: 'Asset Index'.i18n(),
                dialogClass: 'assetIndex',
                minWidth: 800,
                minHeight: 400,
            });
            assetWin.track({
                module_id: 'assetIndex',
                is_unique: true,
                data: null
            });
            assetWin.dialog('open'); /* bring window to front */
            require(['text!assetindex/assetIndex.html'], initAssetWin);
        } else
            assetWin.moveToTop();
    });
}

const state = {
    dropdown: {
        display_markets: null,
        display_submarkets: null,
        is_volatility: false,
        market_submarkets: null,
        selected_market: null
    },
    table: {
        asset_data: [],
        asset_data_extract: [],
        display_headers: [],
        display_asset_name: [],
        display_asset_data: [],
        search_input: ''
    },
    index: {
        symbol: 0,
        display_name: 1,
        assets: 2,
        asset_props: {
            asset_name: 0,
            asset_display_name: 1,
            asset_from: 2,
            asset_to: 3,
        }
    },
    search: function (event, model) {
        model.table.display_asset_data = [];
        const value = model.table.search_input.toLowerCase();
        model.table.display_asset_data = model.table.asset_data_extract.filter((asset) => asset[0].toLowerCase().indexOf(value.toLowerCase()) !== -1);
        model.dropdown.is_volatility = checkVolatility(model.dropdown.selected_market, model.dropdown.display_markets);
    }
}

const checkVolatility = (market_name, market_names) => {
    const volatility_indices = isEU() ? market_names[0][0].innerText : market_names[0][3].innerText;
    const is_volatility = market_name.indexOf(volatility_indices) !== -1;
    return is_volatility;
}

const getEUMarkets = (markets) => {
    const volatility_index_name = markets[3].name;
    const loginId = (local_storage.get('authorize') || {}).loginid || '';
    markets = markets.filter(market => {
        return ((isEU() && market.name === volatility_index_name)
            || (!/MF/gi.test(loginId) && !/MLT/gi.test(loginId) && !/MX/gi.test(loginId)));
      });
    return markets;
}

const isEU = () => {
    const loginId = (local_storage.get('authorize') || {}).loginid || '';
    const residence = (local_storage.get('authorize') || {}).country || '';
    return /MF/gi.test(loginId) || /MLT/gi.test(loginId) || /MX/gi.test(loginId) || /no/gi.test(residence)
}

const filterMarkets = (markets, display_name) => markets.reduce((object, item) => {
    if (item.hasOwnProperty('instruments')) {
        object[item[display_name]] = item.instruments.map((symbol) => symbol.display_name);
    } else {
        object[item[display_name]] = filterMarkets(item.submarkets, 'display_name');
    }
    return object;
}, {})

const getMarketsSubmarkets = (markets) => {
    markets = menu.extractFilteredMarkets(markets);
    const checked_eu_markets = getEUMarkets(markets);
    const select_market_submarket = filterMarkets(checked_eu_markets, 'display_name');
    console.log(select_market_submarket)
    return select_market_submarket;
}

const getMsYeah = (active_symbols) => {
    const select_market_submarket = active_symbols.reduce((object, item)=> {
        object[item.market_display_name] = object[item.market_display_name] || {};
        object[item.market_display_name][item.submarket_display_name] = object[item.market_display_name][item.submarket_display_name] || [];
        object[item.market_display_name][item.submarket_display_name].push(item.display_name);
        return object
    }, {})
    console.log(select_market_submarket)
    return active_symbols
}

const refreshTable = () => {
    const updateTable = (market_name, submarket_name) => {
        state.dropdown.selected_market = market_name;
        state.dropdown.is_volatility = checkVolatility(market_name, state.dropdown.display_markets);
        const symbols = state.dropdown.market_submarkets[market_name][submarket_name];
        updateHeader();
        const rows = state.table.asset_data
            .filter((asset) => {
                return symbols.indexOf(asset[state.index.display_name]) > -1;
            })
            .map((asset) => {
                const props = [];
                const Rise_Fall = asset[state.index.assets][0];
                const Higher_Lower = asset[state.index.assets][1];
                const getRowValue = (name, display_name) => {
                    // handle two different callputs: Rise/Fall and Higher/Lower
                    const prop = typeof(display_name) !== 'undefined' ? 
                        asset[state.index.assets].find(asset => asset[state.index.asset_props.asset_display_name] === display_name) || [] : 
                        asset[state.index.assets].find(asset => asset[state.index.asset_props.asset_name] === name) || [];
                    return `${prop[state.index.asset_props.asset_from] || ''} - ${prop[state.index.asset_props.asset_to] || ''}`;
                };
                    props.push(asset[1]);
                    props.push(getRowValue('callput', Rise_Fall ? Rise_Fall[state.index.asset_props.asset_display_name] : '-'));
                    props.push(getRowValue('callput', Higher_Lower ? Higher_Lower[state.index.asset_props.asset_display_name] : '-'));
                    props.push(getRowValue('touchnotouch'));
                    props.push(getRowValue('endsinout'));
                    props.push(getRowValue('staysinout'));
                    props.push(getRowValue('callputequal'));
                    if(state.dropdown.is_volatility) {
                        props.push(getRowValue('lookback'));
                        props.push(getRowValue('digits'));
                        props.push(getRowValue('asian'));
                        props.push(getRowValue('reset'));
                        props.push(getRowValue('callputspread'));
                        props.push(getRowValue('highlowticks'));
                    }
                return props;
            });
        state.table.display_asset_data = rows;
        state.table.asset_data_extract = rows;
    }

    const updateHeader = () => {
        state.table.display_headers = [];
        state.table.asset_data.forEach(asset => {
            asset[2].forEach(rows => {
                if (!state.table.display_headers.includes(rows[1])) {
                    if(state.dropdown.is_volatility){
                        state.table.display_headers.push(rows[1]);
                    } else {
                        if(state.table.display_headers.length < 6 ) {
                            state.table.display_headers.push(rows[1]);
                        }
                    }
                }
            })
        })
    }

    const marketsChanged = (market_submarkets) => {
        if (!state.dropdown.display_markets) {
            state.dropdown.display_markets = windows
                .makeSelectmenu($('<select />').insertBefore(dialog_buttons), {
                    list: isEU() ? [Object.keys(market_submarkets)[3]] : Object.keys(market_submarkets), //Keys are the display_name
                    inx: 0, //Index to select the item in drop down
                    changed: (val) => {
                        const list = Object.keys(market_submarkets[val]); /* get list of sub_markets */
                        state.dropdown.display_submarkets.update_list(list);
                        updateTable(state.dropdown.display_markets.val(), state.dropdown.display_submarkets.val());
                    },
                    width: '180px'
                });
            state.dropdown.display_markets.selectmenu('widget').addClass('asset-index-selectmenu');
        } else {
            state.dropdown.display_markets.update_list(Object.keys(market_submarkets));
        }
    }

    const submarketsChanged = (market_submarkets) => {
        if (!state.dropdown.display_submarkets) {
            state.dropdown.display_submarkets = windows
              .makeSelectmenu($('<select />').insertBefore(dialog_buttons), {
                  list: Object.keys(market_submarkets[state.dropdown.display_markets.val()]),
                  inx: 0,
                  changed: (val) => {
                      updateTable(state.dropdown.display_markets.val(), state.dropdown.display_submarkets.val());
                  },
                  width: '200px'
              });
            state.dropdown.display_submarkets.selectmenu('widget').addClass('asset-index-selectmenu');
          } else {
            state.dropdown.display_submarkets.update_list(Object.keys(market_submarkets[state.dropdown.display_markets.val()]));
          }
    }

    const processing_msg = $(`#${table.attr('id')}_processing`).show();

    Promise.all(
            [
                liveapi.cached.send({ trading_times: new Date().toISOString().slice(0, 10) }),
                liveapi.cached.send({ asset_index: 1 }),
                liveapi.cached.send({ active_symbols: 'brief' })
            ])
        .then((results) => {
                state.table.asset_data = [...results[1].asset_index];
                state.dropdown.market_submarkets = getMarketsSubmarkets(Object.assign(results[0]));
                const active_symbols = getMsYeah(Object.assign(results[2].active_symbols))
                header = assetWin.parent().find('.ui-dialog-title').addClass('with-content');
                dialog_buttons = assetWin.parent().find('.ui-dialog-titlebar-buttonpane');
                marketsChanged(state.dropdown.market_submarkets);
                submarketsChanged(state.dropdown.market_submarkets);
                updateTable(state.dropdown.display_markets.val(), state.dropdown.display_submarkets.val());
                processing_msg.hide();
        })
        .catch((error) => {
            $.growl.error({ message: error.message });
            console.error(error);
        });   
}

const initAssetWin = ($html) => {
    $html = $($html).i18n();
    table = $html.filter('table');
    $html.appendTo(assetWin);
    rv.bind($html[0], state);
    refreshTable();
    require(['websockets/binary_websockets'], (liveapi) => {
      liveapi.events.on('login', refreshTable);
      liveapi.events.on('logout', refreshTable);
   });
}

export default {
    init
}
