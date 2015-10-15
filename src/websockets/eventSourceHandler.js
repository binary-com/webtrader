/**
 * Created by arnab on 2/24/15.
 */

define(['binary-live-api', 'reconnecting-websocket', 'jquery-timer'],
    function (binary_live_api, ReconnectingWebSocket) {

    function WebtraderWebsocket(api_url) {
        var ws = new ReconnectingWebSocket(api_url);
        ws.debug = false;
        ws.timeInterval = 5400;
        //TODO ws.onerror(...)
        return ws;
    }
    var liveapi = new binary_live_api.LiveApi(WebtraderWebsocket);

    require(['websockets/tick_handler']); // require tick_handler to handle ticks.
    require(['websockets/connection_check']); // require connection_check to handle pings.

    _ggg = liveapi;
    return liveapi;
});
