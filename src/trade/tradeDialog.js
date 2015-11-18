/**
 * Created by amin on November 18, 2015.
 */

define(['jquery', 'windows/windows', 'text!trade/tradeDialog.html', 'css!trade/tradeDialog.css', 'jquery-ui'], function ($, windows, $html) {

    /* The symbol is in the following format:
         symbol = {
            symbol: "frxXAUUSD",
            display_name: "Gold/USD",
            delay_amount: 0,
            settlement: "",
            feed_license: "realtime",
            events: [{ dates: "Fridays", descrip: "Closes early (at 21:00)" }, { dates: "2015-11-26", descrip: "Closes early (at 18:00)" }],
            times: { open: ["00:00:00"], close: ["23:59:59"], settlement: "23:59:59" }
          },

      The contracts_for is in the following format:
        contracts_for = {
            open: 1447801200,
            close: 1447822800,
            hit_count: 14,
            spot: "5137.20",
            available: [
                {
                    market: "indices",
                    contract_display: "higher",
                    min_contract_duration: "1d",
                    max_contract_duration: "365d",
                    barriers: 0,
                    sentiment: "up",
                    barrier_category: "euro_atm",
                    start_type: "spot",
                    contract_category: "callput",
                    submarket: "asia_oceania",
                    exchange_name: "ASX",
                    expiry_type: "daily",
                    underlying_symbol: "AS51",
                    contract_category_display: "Up/Down",
                    contract_type: "CALL"
                }]
        }
       */

    var symbol = null, contracts_for = null;
    var dialog = null; // trade dialog
    var contract_type = null;
    $html = $($html);

    function contract_type_change() {
        type = contract_type.find('option:selected').val();
        console.warn(type);
    }

    function init(_symbol, _contracts_for) {
        symbol = _symbol;
        contracts_for = _contracts_for;
        console.warn(symbol,contracts_for);

        dialog = windows.createBlankWindow($html, {
            title: symbol.display_name,
            resizable:false,
            collapsable:false,
            minimizable: false,
            maximizable: false,
            //height: 500
        });

        contract_type = $html.find('.contract-type')
                             .selectmenu({ change: contract_type_change });
        contract_type_change();

        dialog.dialog('open');
    }

    return {
        init: init
    };
});
