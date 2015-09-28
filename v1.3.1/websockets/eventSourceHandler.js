/**
 * Created by arnab on 2/24/15.
 */

define(['currentPriceIndicator', 'lokijs',  'reconnecting-websocket', 'websockets/ohlc_handler', 'websockets/tick_handler', 'websockets/symbol_handler', 'websockets/connection_check', 'common/util', 'jquery-timer'], function(currentPrice, loki, ReconnectingWebSocket, ohlc_handler, tick_handler, symbol_handler, connection_check) {

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
    connection_check.init(webSocketConnection, chartingRequestMap);
    webSocketConnection.onmessage = function(event) {
        var data = JSON.parse( event.data );
        console.log('Message type : ', data.msg_type);
        switch( data.msg_type ) {
          
          case 'ping':
            connection_check.process();
            break;

          case "trading_times":
            symbol_handler.process( data );
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
                                        .find({instrumentCdAndTp : data.echo_req.instrumentCdAndTp})
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
                            instrumentCdAndTp : data.echo_req.instrumentCdAndTp,
                            time: time,
                            open: open,
                            high: high,
                            low: low,
                            close: close
                      });
                  }
            }
            ohlc_handler.barsLoaded(data.echo_req.instrumentCdAndTp, chartingRequestMap, barsTable, data.echo_req.isTimer, null);
            break;

          case "history":
            //For tick history handling
            for (var index in data.history.times) {
                var time = parseInt(data.history.times[index]) * 1000,
                    price = parseFloat(data.history.prices[index]),
                    bar  = barsTable.chain()
                                        .find({time : time})
                                        .find({instrumentCdAndTp : data.echo_req.instrumentCdAndTp})
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
                            instrumentCdAndTp : data.echo_req.instrumentCdAndTp,
                            time: time,
                            open: price,
                            high: price,
                            low: price,
                            close: price
                      });
                  }
            }
            ohlc_handler.barsLoaded(data.echo_req.instrumentCdAndTp, chartingRequestMap, barsTable, false, null);
            break;

          case "tick":
            console.log(JSON.stringify(data));
            if (data.echo_req.instrumentCdAndTp) {
                chartingRequestMap[data.echo_req.instrumentCdAndTp].tickStreamingID = data.tick.id;
            }
            //console.log(data);
            if (data.tick.error) {
              //This means, there is no real time feed for this instrument
              $(document).trigger("feedTypeNotification", [data.echo_req.instrumentCdAndTp, "delayed-feed"]); //TODO have to consume this notification
            } else {
              if (data.echo_req.instrumentCdAndTp) {
                var chartingRequest = chartingRequestMap[data.echo_req.instrumentCdAndTp];
                if (chartingRequest) {
                      $(document).trigger("feedTypeNotification", [data.echo_req.instrumentCdAndTp, "realtime-feed"]); //TODO have to consume this notification
                      var price = parseFloat(data.tick.quote);
                      var time = parseInt(data.tick.epoch) * 1000;
                      tick_handler.tickReceived(chartingRequest, data.echo_req.instrumentCdAndTp, time, price, barsTable);
                }
              }
            }
            break;

          case 'error':
            console.log('[ERROR] : ', JSON.stringify(data));
            break;
        }
    };

    $(document).bind('sendAnyWSMessage', function(event, wsCompatibleJSONObject) {
        webSocketConnection.send(JSON.stringify(wsCompatibleJSONObject));
    });


    return {

        retrieveInstrumentList : function() {
            if (isConnectionReady) {
                webSocketConnection.send(JSON.stringify({"trading_times": "" + new Date().toISOString().slice(0, 10)}));
            } else {
                $(document).one('websocketsConnectionReady', function() {
                    webSocketConnection.send(JSON.stringify({"trading_times": "" + new Date().toISOString().slice(0, 10)}));
                });
            }
        },

        retrieveChartDataAndRender : function( containerIDWithHash, instrumentCode, instrumentName, timeperiod, type, series_compare )
        {
            //Init the current price indicator
            currentPrice.init();

            if (isConnectionReady) {
                ohlc_handler.retrieveChartDataAndRender( timeperiod, instrumentCode, containerIDWithHash, type, instrumentName, series_compare, chartingRequestMap, webSocketConnection, barsTable );
            } else {
                $(document).one('websocketsConnectionReady', function() {
                    ohlc_handler.retrieveChartDataAndRender( timeperiod, instrumentCode, containerIDWithHash, type, instrumentName, series_compare, chartingRequestMap, webSocketConnection, barsTable );
                });
            }
        },

        close : function ( containerIDWithHash, timeperiod, instrumentCode )
        {
            if (!timeperiod || !instrumentCode) return;

            var instrumentCdAndTp = (instrumentCode + timeperiod).toUpperCase();
            if (chartingRequestMap) {
                for (var index in chartingRequestMap[instrumentCdAndTp].chartIDs) {
                    var chartID = chartingRequestMap[instrumentCdAndTp].chartIDs[index];
                    if (chartID.containerIDWithHash == containerIDWithHash) {
                        chartingRequestMap[instrumentCdAndTp].chartIDs.splice(index, 1);
                        break;
                    }
                }
            }
            if ($.isEmptyObject(chartingRequestMap[instrumentCdAndTp].chartIDs)) {
                webSocketConnection.send(JSON.stringify({"forget" : chartingRequestMap[instrumentCdAndTp].tickStreamingID}));
                $(document).stopTime(chartingRequestMap[instrumentCdAndTp].timerHandler);
                delete chartingRequestMap[instrumentCdAndTp];
            }
        }

    };

});
