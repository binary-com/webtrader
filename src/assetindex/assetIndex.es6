/**
 * Created by amin on October 19, 2015.
 */
import $ from 'jquery';
import windows from '../windows/windows';
import liveapi from '../websockets/binary_websockets';
import menu from "../navigation/menu";
import _ from "lodash";
import "datatables";
import "jquery-growl";
import 'css!./assetIndex.css';

let table = null;
let assetWin = null;
let market_names = null;
let submarket_names = null;
let assets = [];
let markets = {};

export const init = (li) => {
    li.click(() => {
        if (!assetWin) {
            assetWin = windows.createBlankWindow($('<div/>'), {
                title: 'Asset Index'.i18n(),
                dialogClass: 'assetIndex',
                width: 800,
                height: 400
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

const processMarketSubmarkets = (markets) => {
    markets = menu.extractFilteredMarkets(markets);

    const ret = {};
    markets
      .filter(eMarket => {
        const loginId = (local_storage.get('authorize') || {}).loginid || '';
        return (/MF/gi.test(loginId) && eMarket.name !== 'Volatility Indices')
        || (/MLT/gi.test(loginId) && eMarket.name === 'Volatility Indices')
        || (/MX/gi.test(loginId) && eMarket.name === 'Volatility Indices')
        || (!/MF/gi.test(loginId) && !/MLT/gi.test(loginId) && !/MX/gi.test(loginId));
      })
      .forEach((market) => {
        const smarkets = ret[market.display_name] = {};
        market.submarkets.forEach((smarket) => {
            smarkets[smarket.display_name] = smarket.instruments.map((symbol) => {
                return symbol.display_name; });
        });
    });
    return ret;
}

const refreshTable = () => {
    const updateTable = (market_name, submarket_name) => {
        const symbols = markets[market_name][submarket_name];
        const rows = assets
            .filter((asset) => {
                return symbols.indexOf(asset[1] /* asset.name */ ) > -1;
            })
            .map((asset) => {
                /* secham:
                    [ "frxAUDJPY","AUD/JPY",
                      [
                        ["callput","callput","5t","365d"],
                        ["touchnotouch","Touch/No Touch","1h","1h"],
                        ["endsinout","endsinout","1d","1d"],
                        ["staysinout","staysinout","1d","1d"]
                      ]
                    ]
                    asset[0] = frxAUDJPY
                    asset[1] = AUD/JPY
                    asset[2] = ["callput","callput","5t","365d"]
                      prop[0] = callput
                      prop[1] = callput
                      prop[2] = 5t
                      prop[3] = 365d
                */
                const props = [];
                const getRowValue = (key) => {
                  const prop = _.chain(asset[2]).find(f => _.first(f) === key).value() || [];
                  return `${_.trim(prop[2])} - ${_.trim(prop[3])}`;
                };
                props.push(asset[1]);
                props.push(getRowValue('lookback'));
                props.push(getRowValue('callput'));
                props.push(getRowValue('touchnotouch'));
                props.push(getRowValue('endsinout'));
                props.push(getRowValue('staysinout'));
                props.push(getRowValue('digits'));
                props.push(getRowValue('asian'));

                return props;
            });
        table.api().rows().remove();
        table.api().rows.add(rows);
        // Show/Hide Lookback, Digits & Asians col based on market = Volatility Indices
        const show = market_name.indexOf('Volatility Indices') !== -1;
        table.api().column(1).visible(show);
        table.api().column(6).visible(show);
        table.api().column(7).visible(show);
        table.api().draw();
    }

    const processing_msg = $('#' + table.attr('id') + '_processing').show();
    Promise.all(
            [
                liveapi.cached.send({ trading_times: new Date().toISOString().slice(0, 10) }),
                liveapi.cached.send({ asset_index: 1 }),
            ])
        .then((results) => {
            try {
              assets = results[1].asset_index;
              markets = processMarketSubmarkets(results[0]);
                const header = assetWin.parent().find('.ui-dialog-title').addClass('with-content');
                const dialog_buttons = assetWin.parent().find('.ui-dialog-titlebar-buttonpane');

                if (!market_names) {
                  market_names = windows
                      .makeSelectmenu($('<select />').insertBefore(dialog_buttons), {
                          list: Object.keys(markets), //Keys are the display_name
                          inx: 0, //Index to select the item in drop down
                          changed: (val) => {
                              const list = Object.keys(markets[val]); /* get list of sub_markets */
                              submarket_names.update_list(list);
                              updateTable(market_names.val(), submarket_names.val());
                          },
                          width: '180px'
                      });
                  market_names.selectmenu('widget').addClass('asset-index-selectmenu');
                } else {
                  market_names.update_list(Object.keys(markets));
                }

                const is_rtl_language = local_storage.get('i18n') && local_storage.get('i18n').value === 'ar';
                if (!submarket_names) {
                  submarket_names = windows
                    .makeSelectmenu($('<select />').insertBefore(is_rtl_language ? market_names : dialog_buttons), {
                        list: Object.keys(markets[market_names.val()]),
                        inx: 0,
                        changed: (val) => {
                            updateTable(market_names.val(), submarket_names.val());
                        },
                        width: '200px'
                    });
                  submarket_names.selectmenu('widget').addClass('asset-index-selectmenu');
                } else {
                  submarket_names.update_list(Object.keys(markets[market_names.val()]));
                }

                updateTable(market_names.val(), submarket_names.val());
                processing_msg.hide();
            } catch (err) { console.error(err) }
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

    table = table.dataTable({
        data: [],
        "columnDefs": [
            { className: "dt-body-center dt-header-center", "targets": [0, 1, 2, 3, 4, 5, 6, 7] },
            { "defaultContent": "-", "targets": [0, 1, 2, 3, 4, 5, 6, 7] }
        ],
        paging: false,
        ordering: false,
        searching: true,
        processing: true
    });
    table.parent().addClass('hide-search-input');

    // Apply the a search on each column input change
    table.api().column(0).every(function() {
        const column = this;
        $('input', this.header()).on('keyup change', function() {
            if (column.search() !== this.value)
                column.search(this.value).draw();
        });
    });

    refreshTable();
    require(['websockets/binary_websockets'], (liveapi) => {
      liveapi.events.on('login', refreshTable);
      liveapi.events.on('logout', refreshTable);
   });
}

export default {
    init
}
