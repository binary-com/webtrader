/**
 * Created by arnab on 4/9/16.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "lodash", 'common/rivetsExtra', 'moment', 'jquery-growl', 'common/util'], function($, windows, liveapi, _, rv, moment) {

    var win = null, timerHandler = null, FIRST_SCREEN_HEIGHT = 260, SECOND_SCREEN_HEIGHT = 310;
    var settingsData = {
        timeOutInMins: (local_storage.get("realitycheck") || {}).timeOutInMins || 10,
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
                $.growl.error({ message : 'Please enter a number between '.i18n() + scope.timeOutMin + ' and '.i18n() + scope.timeOutMax });
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

    function resetWindow(showFirstScreen) {
        if(win) {
            var winWidget = win.dialog('widget');
            if (showFirstScreen) {
                win.dialog({height: FIRST_SCREEN_HEIGHT});
                winWidget.find('.realitycheck_firstscreen').show();
                winWidget.find('.realitycheck_secondscreen').hide();
            } else {
                win.dialog({height: SECOND_SCREEN_HEIGHT});
                winWidget.find('.realitycheck_firstscreen').hide();
                winWidget.find('.realitycheck_secondscreen').show();
            }
        }
    }

    var setOrRefreshTimer = function(timeOutInMins) {

        if (timerHandler) clearTimeout(timerHandler);
        var logoutAfter_ms = timeOutInMins * 60 * 1000;
        timerHandler = setTimeout(function() {
            liveapi
                .send({ reality_check : 1 })
                .then(function(data) {
                    /*
                     * Showing the reality check popup only if the user is using his real account otherwise keeping it minimized.
                     */
                    if(local_storage.get("authorize").is_virtual) return;
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
                    resetWindow(false);
                    win.moveToTop();
                });
        }, logoutAfter_ms);

    };

    function init() {

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
                                    var div = $(html).i18n();
                                    win = windows.createBlankWindow($('<div/>'), {
                                        title: 'Reality check'.i18n(),
                                        width: 600,
                                        minHeight: FIRST_SCREEN_HEIGHT,
                                        height: FIRST_SCREEN_HEIGHT,
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
                                    resetWindow(true);

                                    rv.bind(div[0], settingsData);

                                    resolve();
                                });

                            } else {
                                local_storage.remove('realitycheck');
                            }
                        });
                })
                .catch(function(err) {
                    local_storage.remove('realitycheck');
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

    var oauthLogin = function() {
        logout();
        if(!local_storage.get("authorize").is_virtual)
            init().then(function() {
                resetWindow(true);
                win.dialog('open');
            });
    };

    liveapi.events.on('oauth-login', oauthLogin);
    liveapi.events.on('login', function (data) {

        if (settingsData.loginId != data.authorize.loginid) {
            logout();
        }

        var realityCheck_fromStorage = local_storage.get("realitycheck");
        if (realityCheck_fromStorage && !local_storage.get("authorize").is_virtual) {
            var durationInMins = (moment.utc().valueOf() - (realityCheck_fromStorage.accepted_time)) / 60 / 1000;
            init().then(function () {
                setOrRefreshTimer(durationInMins >= realityCheck_fromStorage.timeOutInMins ? 0 : Math.abs(realityCheck_fromStorage.timeOutInMins - durationInMins))
            });
        } else {
            oauthLogin();
        }

    });

    liveapi.events.on('logout', function() {
        logout();
        local_storage.remove('realitycheck');
    });

    return {};

});
