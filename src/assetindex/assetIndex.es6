import $ from 'jquery';
import windows from '../windows/windows';
import liveapi from '../websockets/binary_websockets';
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
        display_asset_data: [],
        search_input: ''
    },
    search: function (event, model) {
        model.table.display_asset_data = [];
        const value = model.table.search_input.toLowerCase();
        model.table.display_asset_data = model.table.asset_data_extract.filter((asset) => asset[0].toLowerCase().indexOf(value.toLowerCase()) !== -1);
        model.dropdown.is_volatility = checkVolatility(model.dropdown.selected_market, model.dropdown.display_markets);
    }
}

const checkVolatility = (market_name, market_names) => {
    const volatility_indices = market_names[0][2] ? market_names[0][2].innerText : market_names[0][0].innerText;
    const is_volatility = market_name.indexOf(volatility_indices) !== -1;
    return is_volatility;
}

const getMarketsSubmarkets = (active_symbols) => {
    const select_market_submarket = active_symbols.reduce((object, item) => {
        object[item.market_display_name] = object[item.market_display_name] || {};
        object[item.market_display_name][item.submarket_display_name] = object[item.market_display_name][item.submarket_display_name] || [];
        object[item.market_display_name][item.submarket_display_name].push(item.display_name);
        return object;
    }, {})
    return select_market_submarket
}

const refreshTable = () => {
    const updateTable = (market_name, submarket_name) => {
        state.dropdown.selected_market = market_name;
        state.dropdown.is_volatility = checkVolatility(market_name, state.dropdown.display_markets);
        const symbols = state.dropdown.market_submarkets[market_name][submarket_name];
        let rows = state.table.asset_data
            .filter((asset) => {
                return symbols.indexOf(asset[1]) > -1;
            })
            .map((asset) => {
                state.table.display_headers = [];
                const props = [];
                props.push(asset[1]);
                asset[2].forEach(asset_list => {
                    state.table.display_headers.push(asset_list[1]);
                    props.push([asset_list[1],`${asset_list[2]} - ${asset_list[3]}`]);
                });
                return props;
            });
        rows = assignAssetRows(rows);
        rows = fillEmptyRows(rows);
        state.table.display_asset_data = rows;
        state.table.asset_data_extract = rows;
    }
    const assignAssetRows = (rows) => {
        rows.forEach((assets) => {
            assets.forEach(asset => {
                if(Array.isArray(asset)) {
                    const indexhead = state.table.display_headers.indexOf(asset[0])+1;
                    assets[indexhead] = asset[1];
                }
            });
        });
        return rows;
    }
    const fillEmptyRows = (rows) => {
        const header_length = state.table.display_headers.length;
        for(let i=0; i <= header_length; i++){
            rows.forEach(row => {
                if(!row[i] || Array.isArray[row[i]]){
                    row[i] = '-';
                }
            });
        }
        return rows;
    }
    const marketsChanged = (market_submarkets) => {
        if (!state.dropdown.display_markets) {
            state.dropdown.display_markets = windows
                .makeSelectmenu($('<select />').insertBefore(dialog_buttons), {
                    list: Object.keys(market_submarkets), //Keys are the display_name
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
                liveapi.cached.send({ active_symbols: 'brief' }),
                liveapi.cached.send({ asset_index: 1 }),
            ])
        .then((results) => {
                state.dropdown.market_submarkets = getMarketsSubmarkets(Object.assign(results[0].active_symbols));
                state.table.asset_data = [...results[1].asset_index];
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