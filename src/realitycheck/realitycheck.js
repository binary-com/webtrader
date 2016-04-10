/**
 * Created by arnab on 4/9/16.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "lodash", 'common/rivetsExtra', "jquery-growl", 'common/util'], function($, windows, liveapi, _, rv) {

    var win = null, timerHandler = null;
    var settingsData = {
        timeOutInMins: null,
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
        update : function(event, scope) {
            console.log('update reality check time : ', scope);
            var data = {
                "set_self_exclusion": 1,
                "session_duration_limit": scope.session_duration_limit,
                "exclude_until": scope.exclude_until,
                "max_open_bets": scope.max_open_bets,
                "max_balance": scope.max_balance,
                "max_30day_losses": scope.max_30day_losses,
                "max_turnover": scope.max_turnover,
                "max_30day_turnover": scope.max_30day_turnover,
                "max_7day_losses": scope.max_7day_losses,
                "max_losses": scope.max_losses,
                "max_7day_turnover": scope.max_7day_turnover
            };

            liveapi.send(data)
                .then(function(response) {
                    $.growl.notice({ message : "Your changes have been updated" });
                    setOrRefreshTimer();
                })
                .catch(function (err) {
                    $.growl.error({ message: err.message });
                    console.error(err);
                });
        }
    };

    var init = function() {
        require(["css!realitycheck/realitycheck.css"]);
        return new Promise(function(res) {
            require(['text!realitycheck/realitycheck.html'], function(html) {
                var div = $(html);
                win = windows.createBlankWindow($('<div/>'), {
                    title: 'Reality check',
                    width: 700,
                    minHeight:90,
                    'data-authorized': 'true',
                    destroy: function() {
                        win = null;
                    }
                });
                div.appendTo(win);
                rv.bind(div[0], settingsData);
                refreshData();
                res();
            });
        });
    };
    var refreshData = function() {
        return liveapi
            .send({ get_self_exclusion : 1 })
            .then(function(response) {
                if (response.get_self_exclusion) {
                    settingsData.bought = response.reality_check.buy_count;
                    settingsData.sold = response.reality_check.sell_count;
                    settingsData.loginTime = epoch_to_string(response.reality_check.start_time, {utc: true}) + " GMT";
                    settingsData.max_7day_turnover = response.reality_check.sell_amount;
                    settingsData.max_7day_losses = response.reality_check.buy_amount;
                    settingsData.open = response.reality_check.open_contract_count;
                    settingsData.max_30day_losses = response.reality_check.currency;
                    settingsData.loginId = response.reality_check.loginid;
                    settingsData.potentialProfit = response.reality_check.potential_profit;
                }
            })
            .catch(function (err) {
                $.growl.error({ message: err.message });
                console.error(err);
            });
    };

    var setOrRefreshTimer = function() {

        if (_.isUndefined(settingsData.session_duration_limit)
            || _.isNull(settingsData.session_duration_limit)
            || !_.isNumber(settingsData.session_duration_limit)) return;

        if (timerHandler) clearTimeout(timerHandler);
        var logoutAfter_seconds = settingsData.session_duration_limit * 60 * 1000;
        timerHandler = setLongTimeout(function() {
            $.growl.warning({ message : 'Logging out because of self-exclusion session time out!' });
            console.log('Logging out because of self-exclusion session time out, time elapsed (in ms) :', logoutAfter_seconds);
            liveapi.invalidate();
        }, logoutAfter_seconds, function(handle) {
            timerHandler = handle;
        });
    };

    liveapi.events.on('login', function(data) {
        liveapi.cached.authorize()
            .then(function() {
                refreshData()
                    .then(function() {
                        setOrRefreshTimer();
                    });
            });
    });
    liveapi.events.on('logout', function() {
        if (win) win.dialog('destroy');
        win = null;
        if (timerHandler) clearTimeout(timerHandler)
        timerHandler = null;
        settingsData.max_balance= null;
        settingsData.max_turnover= null;
        settingsData.max_losses= null;
        settingsData.max_7day_turnover= null;
        settingsData.max_7day_losses= null;
        settingsData.max_30day_turnover= null;
        settingsData.max_30day_losses= null;
        settingsData.max_open_bets= null;
        settingsData.session_duration_limit= null;
        settingsData.exclude_until= null;
    });

    return {
        /**
         * This method will load the dialog HTML and show to user
         * @param $menuLink
         */
        init : function($menuLink) {
            $menuLink.click(function () {
                liveapi.cached.authorize()
                    .then(function() {
                        if (!win) {
                            init().then(function () {
                                win.dialog('open');
                            });
                        } else {
                            refreshData();
                            win.moveToTop();
                        }
                    })
                    .catch(function (err) {
                        console.error(err);
                    });
            });
        }
    };

});
