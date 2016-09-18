/**
 * Created by amin on October 19, 2015.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "navigation/menu", 'lodash', "datatables", "jquery-growl"], function ($, windows, liveapi, menu, _) {

    var table = null;
    var assetWin = null;

    function init(li) {
        li.click(function () {
            if (!assetWin) {
                assetWin = windows.createBlankWindow($('<div/>'), {
                    title: 'Asset Index'.i18n(),
                    width: 700 ,
                    height: 400
                });
                assetWin.track({
                  module_id: 'assetIndex',
                  is_unique: true,
                  data: null
                });
                assetWin.dialog('open'); /* bring window to front */
                require(['text!assetindex/assetIndex.html'], initAssetWin);
            }
            else
                assetWin.moveToTop();
        });
    }

    function processMarketSubmarkets(markets) {
        markets = menu.extractChartableMarkets(markets);

        var ret = {};
        markets.forEach(function (market) {
            var smarkets = ret[market.display_name] = {};
            market.submarkets.forEach(function (smarket) {
                smarkets[smarket.display_name] = smarket.instruments.map(function (symbol) { return symbol.display_name; });
            });
        });
        return ret;
    }

    function refreshTable() {
        var assets = [];
        var markets = {};
        var updateTable = function (market_name, submarket_name) {
            var symbols = markets[market_name][submarket_name];
            var rows = assets
                .filter(function (asset) {
                    return symbols.indexOf(asset[1] /* asset.name */) > -1;
                })
                .map(function (asset) {
                    /* secham:
                        [ "frxAUDJPY","AUD/JPY",
                            ["callput","callput","5t","365d"],
                            ["touchnotouch","Touch/No Touch","1h","1h"],
                            ["endsinout","endsinout","1d","1d"],
                            ["staysinout","staysinout","1d","1d"]
                        ]
                    */
                    var props = asset[2] /* asset.props */
                        .map(function (prop) { return prop[2] + ' - ' + prop[3]; }); /* for each property extract a string */
                    props.unshift(asset[1]); /* add asset.name to the beginning of array */

                    return props;
                });
            table.api().rows().remove();
            table.api().rows.add(rows);
            table.api().draw();
        }

        var processing_msg = $('#' + table.attr('id') + '_processing').show();
        Promise.all(
            [
                liveapi.cached.send({ trading_times: new Date().toISOString().slice(0, 10) }),
                liveapi.cached.send({ asset_index: 1 })
            ])
        .then(function (results) {
            try {
                assets = results[1].asset_index;
                markets = processMarketSubmarkets(results[0]);
                var header = assetWin.parent().find('.ui-dialog-title').addClass('with-content');
                var dialog_buttons = assetWin.parent().find('.ui-dialog-titlebar-buttonpane');

                var market_names = windows
                    .makeSelectmenu($('<select />').insertBefore(dialog_buttons), {
                        list: Object.keys(markets), //Keys are the display_name
                        inx: 1, //Index to select the item in drop down
                        changed: function (val) {
                            var list = Object.keys(markets[val]); /* get list of sub_markets */
                            submarket_names.update_list(list);
                            updateTable(market_names.val(), submarket_names.val());
                        },
                        width: '180px'
                    });
                market_names.selectmenu('widget').addClass('asset-index-selectmenu');

                var is_rtl_language = local_storage.get('i18n') && local_storage.get('i18n').value === 'ar';
                var submarket_names = windows
                    .makeSelectmenu($('<select />').insertBefore(is_rtl_language ? market_names : dialog_buttons), {
                        list: Object.keys(markets[market_names.val()]),
                        inx: 0,
                        changed: function (val) {
                            updateTable(market_names.val(), submarket_names.val());
                        },
                        width: '200px'
                    });
                submarket_names.selectmenu('widget').addClass('asset-index-selectmenu');

                updateTable(market_names.val(),submarket_names.val());
                processing_msg.hide();
            } catch (err) { console.error(err) }
        })
        .catch(function (error) {
            $.growl.error({ message: error.message });
            console.error(error);
        });
    }

    function initAssetWin($html) {
        $html = $($html).i18n();
        table = $html.filter('table');
        $html.appendTo(assetWin);

        table = table.dataTable({
            data: [],
            "columnDefs": [
                { className: "dt-body-center dt-header-center", "targets": [0, 1, 2, 3, 4] },
                { "defaultContent": "-", "targets": [0,1,2,3,4] }
            ],
            paging: false,
            ordering: false,
            searching: true,
            processing: true
        });
        table.parent().addClass('hide-search-input');

        // Apply the a search on each column input change
        table.api().column(0).every(function () {
            var column = this;
            $('input', this.header()).on('keyup change', function () {
                if (column.search() !== this.value)
                    column.search(this.value).draw();
            });
        });

        refreshTable();
    }

    return {
        init: init
    }
});
