/**
 * Created by arnab on 2/24/15.
 */

define(['lokijs', 'reconnecting-websocket', 'common/util', 'jquery-timer'],
    function (loki, ReconnectingWebSocket) {

    var db = new loki();
    /**
        {
            instrumentCode+timeperiod,
            time, //in milliseconds
            open,
            high,
            low,
            close
        }
    **/
    var barsTable = db.addCollection('bars_table');

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
    var chartingRequestMap = {};

    //Init websockets here
    var isConnectionReady = false;
    var webSocketConnection = new ReconnectingWebSocket("wss://www.binary.com/websockets/v2");
	webSocketConnection.debug = false;
  	webSocketConnection.timeoutInterval = 5400;
    webSocketConnection.onopen = function(event) {
        isConnectionReady = true;
        $(document).trigger('websocketsConnectionReady');
    };    

    webSocketConnection.onerror = function(event) {
        console.log('WS error!', event);//TODO handle it properly. May be show message to user to refresh the page
    };

    var callbacks = {};
    webSocketConnection.onmessage = function(event) {
        var data = JSON.parse( event.data );
        console.log('Message type : ', data.msg_type);
        switch( data.msg_type ) {
          
          case "history":
          case "tick":
          case "candles":
          case 'ping':
              callbacks[data.msg_type] && callbacks[data.msg_type].forEach(function (cb) { cb(data) });
            break;

          case "trading_times":
            callbacks['trading_times'].resolve(data);
            callbacks['trading_times'] = undefined;
            break;

          case 'error':
            console.log('[ERROR] : ', JSON.stringify(data));
            break;
        }
    };

    $(document).bind('sendAnyWSMessage', function(event, wsCompatibleJSONObject) {
        webSocketConnection.send(JSON.stringify(wsCompatibleJSONObject));
    });

    require(['websockets/tick_handler']); // require tick_handler to handle ticks.
    require(['websockets/connection_check']); // require connection_check to handle pings.

    var apicall = {
        /* pass the date in yyy-mm-dd format */
        trading_times: function (yyyy_mm_dd) {
            var apicall = this.custom.bind(this,JSON.stringify({ "trading_times": "" + yyyy_mm_dd }));
            isConnectionReady ? apicall() : $(document).one('websocketsConnectionReady', apicall);
        },
        custom: function (options) {
            webSocketConnection.send(options);
        }
    };
    return {
        getTradingTimes: function (date) {
            return new Promise(function (resolve, reject) {
                callbacks['trading_times'] = { resolve: resolve, reject: reject };
                apicall.trading_times(date.toISOString().slice(0, 10));
            });
        },

        execute: function(fn){
            if (isConnectionReady) fn();
            else $(document).one('websocketsConnectionReady', fn);
        },
        events: {
            on: function (name, cb) {
                callbacks[name] = callbacks[name] || [];
                callbacks[name].push(cb);
            }
        },
        chartingRequestMap : chartingRequestMap,
        barsTable: barsTable,
        send: function(obj){
            webSocketConnection.send(JSON.stringify(obj));
        }
    };

});
