/**
 * Created by arnab on 4/9/16.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "lodash", 'common/rivetsExtra', 'moment', 'jquery-growl', 'common/util'], function($, windows, liveapi, _, rv, moment) {

    var win = null, timerHandler = null;
    var settingsData = {
        timeOutInMins: (local_storage.get("realitycheck") || {}).timeOutInMins || 10,
        timeOutMin: 1, timeOutMax: 120, //TODO
        loginId: null,
        durationInMins: null,
        bought: null,
        turnOver: null,
        loginTime: null,
        sold: null,
        pnl: null,
        currentTime: null,
        open: null,
        potentialProfit: null,
        currency: null,
        continueTrading : function(event, scope) {
            //Validate input
            if (scope.timeOutInMins < scope.timeOutMin || scope.timeOutInMins > scope.timeOutMax) {
                $.growl.error({ message : 'Please enter a number between ' + scope.timeOutMin + ' to ' + scope.timeOutMax });
                return;
            }
            win.dialog('close');
            local_storage.set("realitycheck", { timeOutInMins : scope.timeOutInMins | 0, accepted_time : moment.utc().valueOf() });
            setOrRefreshTimer(scope.timeOutInMins);
        },
        logout : function() {
            liveapi.invalidate();
        }
    };

    var setOrRefreshTimer = function(timeOutInMins) {

        if (timerHandler) clearTimeout(timerHandler);
        var logoutAfter_ms = timeOutInMins * 60 * 1000;
        timerHandler = setTimeout(function() {
            liveapi
                .send({ reality_check : 1 })
                .then(function(data) {
                    var durationIn_ms = moment.utc().valueOf() - data.reality_check.start_time * 1000;
                    var max_durationIn_ms = 48 * 60 * 60 * 1000;
                    if (durationIn_ms > max_durationIn_ms) durationIn_ms = max_durationIn_ms;
                    settingsData.durationInMins = moment.duration(durationIn_ms).humanize();
                    settingsData.bought = data.reality_check.buy_count;
                    settingsData.turnOver = data.reality_check.buy_amount;
                    settingsData.loginTime = moment.utc(data.reality_check.start_time * 1000).format("MMM D, YYYY hh:mm") + " GMT";
                    settingsData.sold = data.reality_check.sell_count;
                    settingsData.pnl = data.reality_check.sell_amount - data.reality_check.buy_amount;
                    settingsData.currentTime = moment.utc().format("MMM D, YYYY hh:mm") + " GMT";
                    settingsData.open = data.reality_check.open_contract_count;
                    settingsData.potentialProfit = data.reality_check.potential_profit;
                    settingsData.currency = data.reality_check.currency;
                    var $root = win.dialog('widget');
                    $root.find('.realitycheck_firstscreen').hide();
                    $root.find('.realitycheck_secondscreen').show();
                    win.dialog({ height : 310 });
                    win.moveToTop();
                });
        }, logoutAfter_ms);

    };
    
    function init() {

        console.log('Reality check login event intercepted');
        if (win) return Promise.resolve(true);

        return new Promise(function(resolve) {
            liveapi
                .cached
                .authorize()
                .then(function(data) {
                    settingsData.loginId = data.authorize.loginid;
                    liveapi
                        .cached
                        .send({landing_company_details : data.authorize.landing_company_name})
                        .then(function(data) {
                            if (data && data.landing_company_details.has_reality_check) {

                                require(['text!realitycheck/realitycheck.html', "css!realitycheck/realitycheck.css"], function(html) {
                                    var div = $(html);
                                    div.find('.realitycheck_firstscreen').show();
                                    div.find('.realitycheck_secondscreen').hide();
                                    win = windows.createBlankWindow($('<div/>'), {
                                        title: 'Reality check',
                                        width: 600,
                                        minHeight:90,
                                        height: 220,
                                        resizable: false,
                                        collapsable: false,
                                        minimizable: false,
                                        maximizable: false,
                                        closable: false,
                                        modal: true,
                                        closeOnEscape: false,
                                        ignoreTileAction:true,
                                        'data-authorized': 'true'
                                    });
                                    div.appendTo(win);

                                    //This helps in showing multiple dialog windows in modal form
                                    $('body').append(win.dialog('widget'));

                                    rv.bind(div[0], settingsData);

                                    resolve();
                                });

                            } else {
                                local_storage.remove('realitycheck');
                            }
                        });
                });
        });
    }

    var logout = function() {
        if (win) win.dialog('close');
        if (timerHandler) clearTimeout(timerHandler);
        timerHandler = null;
        settingsData.timeOutInMins= 10;
        settingsData.loginId= null;
        settingsData.durationInMins= null;
        settingsData.bought= null;
        settingsData.turnOver= null;
        settingsData.loginTime= null;
        settingsData.sold= null;
        settingsData.pnl= null;
        settingsData.currentTime= null;
        settingsData.open= null;
        settingsData.potentialProfit= null;
        settingsData.currency= null;
    };

    var login = function () {
        console.log('Reality check login called');
        logout();
        var realityCheck_fromStorage = local_storage.get("realitycheck");
        console.log('realityCheck_fromStorage', realityCheck_fromStorage);
        if (!realityCheck_fromStorage) {
            init().then(function() { win.dialog('open'); });
        } else {
            var durationInMins = (moment.utc().valueOf() - (realityCheck_fromStorage.accepted_time)) / 60 / 1000;
            if (durationInMins >= realityCheck_fromStorage.timeOutInMins) {
                init().then(function() { win.dialog('open'); });
            } else {
                init().then(function() { setOrRefreshTimer(Math.abs(realityCheck_fromStorage.timeOutInMins - durationInMins)) });
            }
        }
    };

    liveapi.events.on('login', login);

    liveapi.events.on('logout', function() {
        console.log('Reality check logout called');
        logout();
        local_storage.remove('realitycheck');
    });

    return {};

});
