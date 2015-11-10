/**
 * Created by amin on October 15,2015.
 */

/**
    Key is instrumentCode+timeperiod, Value is 
        {
            tickStreamingID : , //Unique returned from WS API call for tick streaming,
            timerHandler : ,
            chartIDs : [
                {
                    containerIDWithHash : containerIDWithHash,
                    series_compare : series_compare,
                    instrumentCode : instrumentCode,
                    instrumentName : instrumentName
                }
            ]
        }
**/
define(['lokijs'],function(loki){
    var db = new loki();
    var barsTable = db.addCollection('bars_table');
    // TODO: add common tasks for chartingRequestMap to this module
    //       move code from charts.js, ohlc_handler.js, tick_handler.js, connection_check.js and symbol_handler.js
    return {
        barsTable: barsTable
    }
})
