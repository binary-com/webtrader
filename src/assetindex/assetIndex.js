/**
 * Created by amin on October 19, 2015.
 */
define(["jquery", "windows/windows", "websockets/eventSourceHandler", "datatables", "jquery-growl"], function ($, windows, liveapi) {

    var table = null;
    var assetWin = null;

    function init(li) {
        loadCSS("assetindex/assetIndex.css");
        li.click(function () {
            if (!assetWin) {
                assetWin = windows.createBlankWindow($('<div/>'), { title: 'Asset Index', width: 700 });
                $.get('assetindex/assetIndex.html', initAssetWin);
            }
            assetWin.dialog('open'); /* bring winodw to front */
        });

        setTimeout(li.click.bind(li), 2000);// TODO: debug only remove this
    }

    function processMarketSubmarkets(data) {
        var markets = (data.trading_times && data.trading_times.markets) || [];

        var ret = {};
        markets.forEach(function (market) {
            var smarkets = ret[market.name] = {};
            market.submarkets.forEach(function (smarket) {
                smarkets[smarket.name] = smarket.symbols.map(function (symbol) { return symbol.name; });
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
                        .map(function (prop) { return prop[2] + '-' + prop[3]; }); /* for each property extract a string */
                    props.unshift(asset[1]); /* add asset.name to the beginning of array */
                     
                    return props;
                });
            table.api().rows().remove();
            table.api().rows.add(rows);
            table.api().draw();
        }

        var processing_msg = $('#' + table.attr('id') + '_processing').show();
        Promise.all(
            [{ trading_times: new Date().toISOString().slice(0, 10) }, { asset_index: 1 }]
            .map(liveapi.send))
        .then(function (results) {
            try {
                assets = results[1].asset_index;
                markets = processMarketSubmarkets(results[0]);
                var titlebar = assetWin.parent().find('.ui-dialog-titlebar');
                var dialog_buttons = assetWin.parent().find('.ui-dialog-titlebar-buttonpane');

                var market_names = windows
                    .makeSelectmenu($('<select />').insertBefore(dialog_buttons), {
                        list: Object.keys(markets),
                        inx: 0,
                        changed: function (val) {
                            var list = Object.keys(markets[val]); /* get list of sub_markets */
                            submarket_names.update_list(list);
                            updateTable(market_names.val(), submarket_names.val());
                        }
                    });

                var submarket_names = windows
                    .makeSelectmenu($('<select />').insertBefore(dialog_buttons), {
                        list: Object.keys(markets[market_names.val()]),
                        inx: 0,
                        changed: function (val) {
                            updateTable(market_names.val(), submarket_names.val());
                        }
                    });

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
        $html = $($html);
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
