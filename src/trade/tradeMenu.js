/**
 * Created by amin on October 30, 2015.
 */
define(["jquery", "websockets/binary_websockets", "common/menu", "jquery-growl"], function ($, liveapi, menu) {

    var show_error = function (err) { $.growl.error({ message: err.message }); console.error(err); };

    function init() {
        require(['trade/tradeDialog']); // Trigger loading of tradeDialog
        liveapi
            .cached.send({ trading_times: new Date().toISOString().slice(0, 10) })
            .then(function (data) {

                var markets = menu.extractChartableMarkets(data);
                menu.sortMenu(markets);

                var root = $("<ul>").appendTo($("#nav-menu").find(".trade")); /* add to trade menu */
                menu.refreshMenu(root, markets, function (li) {
                    var data = li.data();
                    liveapi
                        .send({ contracts_for: data.symbol })
                        .then(function (res) {

                            require(['trade/tradeDialog'], function (tradeDialog) {
                                tradeDialog.init(data, res.contracts_for);
                            });

                        })
                        .catch(show_error);
                });
            })
            .catch(show_error);
    }

    return {
        init: init
    };
});
