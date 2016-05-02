/**
 * Created by arnab on 4/9/16.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "lodash", 'common/rivetsExtra', 'moment', 'jquery-growl', 'common/util'], function($, windows, liveapi, _, rv, moment) {

    var win = null, timerHandler = null;
    var settingsData = {
        timeOutInMins: 10,
        timeOutMin: 10, timeOutMax: 120, 
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
            setOrRefreshTimer(scope.timeOutInMins);
        },
        logout : function() {
            liveapi.invalidate();
        }
    };

    var init = function() {
        require(["css!realitycheck/realitycheck.css"]);
        return new Promise(function(res) {
            require(['text!realitycheck/realitycheck.html'], function(html) {
                var div = $(html);
                div.find('.realitycheck_firstscreen').show();
                div.find('.realitycheck_secondscreen').hide();
                win = windows.createBlankWindow($('<div/>'), {
                    title: 'Reality check',
                    width: 600,
                    minHeight:90,
                    height: 300,
                    resizable: false,
                    collapsable: false,
                    minimizable: false,
                    maximizable: false,
                    closable: false,
                    modal: true,
                    closeOnEscape: false,
                    ignoreTileAction:true,
                    'data-authorized': 'true',
                    destroy: function() {
                        win = null;
                    }
                });
                div.appendTo(win);
                rv.bind(div[0], settingsData);
                res();
            });
        });
    };

    var setOrRefreshTimer = function(timeOutInMins) {

        if (timerHandler) clearTimeout(timerHandler);
        var logoutAfter_ms = timeOutInMins * 60 * 1000;
        timerHandler = setTimeout(function() {
            liveapi
                .send({ reality_check : 1 })
                .then(function(data) {
                    settingsData.durationInMins = moment.duration(moment.utc().valueOf() - data.reality_check.start_time * 1000).humanize();
                    settingsData.bought = data.reality_check.buy_count;
                    settingsData.turnOver = data.reality_check.buy_amount;
                    settingsData.loginTime = moment.unix(data.reality_check.start_time).format("MMM D, YYYY hh:mm") + " GMT";
                    settingsData.sold = data.reality_check.sell_count;
                    settingsData.pnl = data.reality_check.sell_amount - data.reality_check.buy_amount;
                    settingsData.currentTime = moment.utc().format("MMM D, YYYY hh:mm") + " GMT";
                    settingsData.open = data.reality_check.open_contract_count;
                    settingsData.potentialProfit = data.reality_check.potential_profit;
                    settingsData.currency = data.reality_check.currency;
                    var $root = $('.realitycheck');
                    $root.find('.realitycheck_firstscreen').hide();
                    $root.find('.realitycheck_secondscreen').show();
                    win.moveToTop();
                });
        }, logoutAfter_ms);

    };

    liveapi.events.on('login', function(data) {
        console.log('Reality check login event intercepted : ', data.authorize.loginid, data.authorize.landing_company_name);
        liveapi
            .cached
            .authorize()
            .then(function() {
                settingsData.loginId = data.authorize.loginid;
                liveapi
                    .send({landing_company_details : data.authorize.landing_company_name})
                    .then(function(data) {
                        if (data && data.landing_company_details.has_reality_check) {
                            if (win) win.dialog('destroy');
                            init().then(function () { win.dialog('open'); });
                        }
                    });
            });
    });

    liveapi.events.on('logout', function() {
        if (win) win.dialog('destroy');
        win = null;
        if (timerHandler) clearTimeout(timerHandler)
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
    });

    return {};

});
