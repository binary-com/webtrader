import $ from 'jquery';
import windows from '../windows/windows';
import liveapi from '../websockets/binary_websockets';
import rv from 'common/rivetsExtra';
import 'jquery-growl';
import 'css!./assetIndex.css';
import { getObjectMarketSubmarkets, getSortedMarkets, getSortedSubmarkets } from '../common/marketUtils';
import 'common/util'

let table_el = null;
let asset_win_el = null;
let header_el = null;
let dialog_buttons_el = null;

export const init = (li) => {
    li.click(() => {
        if (!asset_win_el) {
            asset_win_el = windows.createBlankWindow($('<div/>'), {
                title: 'Asset Index'.i18n(),
                dialogClass: 'assetIndex',
                minWidth: 800,
                minHeight: 400,
            });
            asset_win_el.track({
                module_id: 'assetIndex',
                is_unique: true,
                data: null
            });
            asset_win_el.dialog('open');
            require(['text!assetindex/assetIndex.html'], initAssetWin);
        } else
            asset_win_el.moveToTop();
    });
}

const state = {
    dropdown: {
        display_markets: null,
        display_submarkets: null,
        is_volatility: false,
        sorted_markets: null,
        market_submarkets: null,
        selected_market: null
    },
    table: {
        asset_data: [],
        asset_data_extract: [],
        display_headers: [],
        display_asset_data: [],
        search_input: ''
    },
    search: function (event) {
        function isTableRowSearchValue(asset) {
            const value = state.table.search_input.toLowerCase();
            return asset[0].toLowerCase().indexOf(value.toLowerCase()) !== -1;
        }

        return (function updateDisplayTable() {
            state.table.display_asset_data = [];
            state.table.display_asset_data = state.table.asset_data_extract.filter(isTableRowSearchValue);
            state.dropdown.is_volatility = checkVolatility(state.dropdown.selected_market, state.dropdown.display_markets);
        })();
    }
}

const checkVolatility = (market_name, market_names) => {
    const volatility_indices = market_names[0][3] ? market_names[0][3].innerText : market_names[0][0].innerText; // locate vol_ind (handle translation)
    const is_volatility = market_name.indexOf(volatility_indices) !== -1;

    return is_volatility;
}

const initTable = () => {
    getActiveSymAndAssetsData()
        .then((result) => {
            liveapi
               .send({ active_symbols: "brief" })
               .then(function (response) {
                populateTable(result, response.active_symbols);
               })
               .catch((err) => {
                    $.growl.error({ message: err.message });
               });
        })
        .catch((error) => {
            $.growl.error({ message: error.message });
            console.error(error);
        });

    function populateTable(result, symbols) {
        const active_symbols_data = symbols;
        const asset_index_data = [...result[0].asset_index];

        if($.isEmptyObject(active_symbols_data) || $.isEmptyObject(asset_index_data)) return;

        state.dropdown.market_submarkets = getObjectMarketSubmarkets(active_symbols_data);
        state.dropdown.sorted_markets = getSortedMarkets(active_symbols_data);
        state.table.asset_data = asset_index_data;

        header_el = asset_win_el.parent().find('.ui-dialog-title').addClass('with-content');
        dialog_buttons_el = asset_win_el.parent().find('.ui-dialog-titlebar-buttonpane');

        marketsDropdown(state.dropdown.market_submarkets);
        submarketsDropdown(state.dropdown.market_submarkets);
        updateTable(state.dropdown.display_markets.val(), state.dropdown.display_submarkets.val());

        function updateTable(market_name, submarket_name) {
            const symbols = [...state.dropdown.market_submarkets[market_name][submarket_name]];
            state.dropdown.selected_market = market_name;
            state.dropdown.is_volatility = checkVolatility(market_name, state.dropdown.display_markets);
            let rows = state.table.asset_data
                .filter((asset) => symbols.indexOf(asset[1]) > -1) // asset[1] is symbol
                .map((asset) => {
                    const props = [];
                    const symbol = asset[1];
                    const asset_data = asset[2];
                    state.table.display_headers = [];
                    props.push(symbol);
                    asset_data.forEach(asset_list => {
                        const asset_type = asset_list[1];
                        const asset_from = asset_list[2];
                        const asset_to = asset_list[3];
                        state.table.display_headers.push(asset_type);
                        props.push([asset_type, `${asset_from} - ${asset_to}`]);
                    });

                    return props;
                });
            rows = assignAssetRows(rows);
            rows = fillFalseRows(rows);

            state.table.display_asset_data = rows;
            state.table.asset_data_extract = rows;

            function assignAssetRows(rows) {
                const row_result = [];
                rows.forEach((assets) => {
                    const temp_asset = new Array(state.table.display_headers.length + 1);
                    assets.forEach(asset => {
                        if (Array.isArray(asset)) {
                            const asset_type = asset[0];
                            const asset_from_to = asset[1];
                            const indexhead = state.table.display_headers.indexOf(asset_type) + 1;
                            temp_asset[indexhead] = asset_from_to;
                        } else {
                            temp_asset[0] = asset;
                        }
                    });
                    row_result.push(temp_asset);
                });
                return row_result;
            }

            function fillFalseRows(rows) {
                const header_length = state.table.display_headers.length;

                for (let i = 0; i <= header_length; i++) {
                    rows.forEach(row => {
                        if (!row[i] || Array.isArray(row[i])) {
                            row[i] = '-';
                        }
                    });
                }

                return rows;
            }
        }

        function marketsDropdown(market_submarkets) {
            const markets_sorted_list = state.dropdown.sorted_markets;

            if (!state.dropdown.display_markets) {
                state.dropdown.display_markets = windows
                    .makeSelectmenu($('<select />').insertAfter(asset_win_el), {
                        list: markets_sorted_list,
                        inx: 0,
                        changed: (val) => {
                            const submarket_list = getSortedSubmarkets(Object.keys(market_submarkets[val]));
                            state.dropdown.display_submarkets.update_list(submarket_list);
                            updateTable(state.dropdown.display_markets.val(), state.dropdown.display_submarkets.val());
                        },
                        width: '180px'
                    });
                state.dropdown.display_markets.selectmenu('widget').addClass('asset-index-selectmenu');
            } else {
                state.dropdown.display_markets.update_list(markets_sorted_list);
            }
        }

        function submarketsDropdown(market_submarkets) {
            const submarkets = Object.keys(market_submarkets[state.dropdown.display_markets.val()]);
            const sorted_submarkets = getSortedSubmarkets(submarkets);

            if (!state.dropdown.display_submarkets) {
                state.dropdown.display_submarkets = windows
                    .makeSelectmenu($('<select />').insertAfter(asset_win_el), {
                        list: sorted_submarkets,
                        inx: 0,
                        changed: (val) => {
                            updateTable(state.dropdown.display_markets.val(), state.dropdown.display_submarkets.val());
                        },
                        width: '200px'
                    });
                state.dropdown.display_submarkets.selectmenu('widget').addClass('asset-index-selectmenu');
            } else {
                state.dropdown.display_submarkets.update_list(sorted_submarkets);
            }
        }
    }

    function getActiveSymAndAssetsData() {
        const processing_msg = $(`#${table_el.attr('id')}_processing`).show();
        const asset_index_request = { asset_index: 1 };

        return Promise.all(
            [
                liveapi.cached.send(asset_index_request),
            ])
            .then((results) => {
                processing_msg.hide();
                return Promise.resolve(results);
            })
            .catch((error) => {
                processing_msg.hide();
                return Promise.reject(error);
            });
    };
}

const initAssetWin = ($html) => {
    $html = $($html).i18n();
    table_el = $html.filter('table');
    $html.appendTo(asset_win_el);
    rv.bind($html[0], state);
    initTable();
    require(['websockets/binary_websockets'], (liveapi) => {
      liveapi.events.on('login', initTable);
      liveapi.events.on('logout', initTable);
   });
}

export default {
    init
}