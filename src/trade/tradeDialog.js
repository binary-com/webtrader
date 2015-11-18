/**
 * Created by amin on November 18, 2015.
 */

define(['jquery', 'windows/windows', 'text!trade/tradeDialog.html', 'css!trade/tradeDialog.css', 'jquery-ui'], function ($, windows, $html) {
    /* The data for each symbol is in the following format:
      data = {
         symbol: "frxXAUUSD",
         display_name: "Gold/USD",
         delay_amount: 0,
         settlement: "",
         feed_license: "realtime",
         events: [{ dates: "Fridays", descrip: "Closes early (at 21:00)" }, { dates: "2015-11-26", descrip: "Closes early (at 18:00)" }],
         times: { open: ["00:00:00"], close: ["23:59:59"], settlement: "23:59:59" }
       } */
    var data = null;
    var dialog = null; // trade dialog
    var contract_type = null;
    $html = $($html);

    function init(_data) {
        console.warn($html);
        data = _data;
        dialog = windows.createBlankWindow($html, {
            title: data.display_name,
            //close: fn, // callback for dialog close event
            //open: fn,  // callback for dialog open event
            resizable:false,
            collapsable:false,
            minimizable: false,
            maximizable: false,
            height: 500
        });
        contract_type = $html.find('.contract-type').selectmenu({});
        dialog.dialog('open');
    }

    return {
        init: init
    };
});
