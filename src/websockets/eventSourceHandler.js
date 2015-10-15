/**
 * Created by arnab on 2/24/15.
 */

define(['lokijs', 'reconnecting-websocket', 'websockets/ohlc_handler', 'websockets/connection_check', 'common/util', 'jquery-timer'],
    function (loki, ReconnectingWebSocket, ohlc_handler, connection_check) {

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

    var that = this;
    var callbacks = {};
    connection_check.init(webSocketConnection, chartingRequestMap);
    webSocketConnection.onmessage = function(event) {
        var data = JSON.parse( event.data );
        console.log('Message type : ', data.msg_type);
        switch( data.msg_type ) {
          
          case 'ping':
            connection_check.process();
            break;

          case "trading_times":
            callbacks['trading_times'].resolve(data);
            callbacks['trading_times'] = undefined;
            break;
          
          case "candles":
            for ( var index in data.candles )
            {
                  var eachData = data.candles[index],
                        open  = parseFloat(eachData.open),
                        high  = parseFloat(eachData.high),
                        low   = parseFloat(eachData.low),
                        close = parseFloat(eachData.close),
                        time  = parseInt(eachData.epoch) * 1000,
                        bar   = barsTable.chain()
                                        .find({time : time})
                                        .find({instrumentCdAndTp : data.echo_req.passthrough.instrumentCdAndTp})
                                        .limit(1)
                                        .data();
                  if (bar && bar.length > 0) {
                    bar = bar[0];
                    bar.open = open;
                    bar.high = high;
                    bar.low = low;
                    bar.close = close;
                    barsTable.update(bar);
                  } else {
                      barsTable.insert({
                            instrumentCdAndTp : data.echo_req.passthrough.instrumentCdAndTp,
                            time: time,
                            open: open,
                            high: high,
                            low: low,
                            close: close
                      });
                  }
            }
            ohlc_handler.barsLoaded(data.echo_req.passthrough.instrumentCdAndTp, chartingRequestMap, barsTable, data.echo_req.passthrough.isTimer, null);
            break;

          case "history":
            //For tick history handling
            for (var index in data.history.times) {
                var time = parseInt(data.history.times[index]) * 1000,
                    price = parseFloat(data.history.prices[index]),
                    bar  = barsTable.chain()
                                        .find({time : time})
                                        .find({instrumentCdAndTp : data.echo_req.passthrough.instrumentCdAndTp})
                                        .limit(1)
                                        .data();
                  if (bar && bar.length > 0) {
                    bar = bar[0];
                    bar.open = price;
                    bar.high = price;
                    bar.low = price;
                    bar.close = price;
                    barsTable.update(bar);
                  } else {
                      barsTable.insert({
                            instrumentCdAndTp : data.echo_req.passthrough.instrumentCdAndTp,
                            time: time,
                            open: price,
                            high: price,
                            low: price,
                            close: price
                      });
                  }
            }
            ohlc_handler.barsLoaded(data.echo_req.passthrough.instrumentCdAndTp, chartingRequestMap, barsTable, false, null);
            break;

          case "tick":
              callbacks['tick'] && callbacks['tick'].forEach(function (cb) { cb(data) });
            //console.log(JSON.stringify(data));
            //if (data.echo_req.passthrough.instrumentCdAndTp) {
            //    chartingRequestMap[data.echo_req.passthrough.instrumentCdAndTp].tickStreamingID = data.tick.id;
            //}
            ////console.log(data);
            //if (data.tick.error) {
            //  //This means, there is no real time feed for this instrument
            //  $(document).trigger("feedTypeNotification", [data.echo_req.passthrough.instrumentCdAndTp, "delayed-feed"]); //TODO have to consume this notification
            //} else {
            //  if (data.echo_req.passthrough.instrumentCdAndTp) {
            //    var chartingRequest = chartingRequestMap[data.echo_req.passthrough.instrumentCdAndTp];
            //    if (chartingRequest) {
            //          $(document).trigger("feedTypeNotification", [data.echo_req.passthrough.instrumentCdAndTp, "realtime-feed"]); //TODO have to consume this notification
            //          var price = parseFloat(data.tick.quote);
            //          var time = parseInt(data.tick.epoch) * 1000;
            //          tick_handler.tickReceived(chartingRequest, data.echo_req.passthrough.instrumentCdAndTp, time, price, barsTable);
            //    }
            //  }
            //}
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
