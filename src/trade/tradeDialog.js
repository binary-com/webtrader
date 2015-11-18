/**
 * Created by amin on November 18, 2015.
 */

define(['jquery','text!trade/tradeDialog.html'], function ($,$html) {
    $html = $($html);


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
    function init(data) {
        console.warn($html[0]);
        console.warn(data);
    }

    return {
        init: init
    };
});
