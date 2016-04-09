/**
 * Created by arnab on 4/5/16.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "lodash", 'common/rivetsExtra', "jquery-growl", 'common/util'], function($, windows, liveapi, _, rv) {

    var win = null, timerHandler = null;
    var settingsData = {
        max_balance: null,
        max_turnover: null,
        max_losses: null,
        max_7day_turnover: null,
        max_7day_losses: null,
        max_30day_turnover: null,
        max_30day_losses: null,
        max_open_bets: null,
        session_duration_limit: null,
        exclude_until: null,
        update : function(event, scope) {
            console.log('update self-exclusion : ', scope);
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
        require(["css!selfexclusion/selfexclusion.css"]);
        return new Promise(function(res) {
            require(['text!selfexclusion/selfexclusion.html'], function(html) {
                var div = $(html);
                win = windows.createBlankWindow($('<div/>'), {
                    title: 'Self-Exclusion Facilities',
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
        $.growl.notice({ message: "Loading self-exclusion settings!" });
        return liveapi
                .send({ get_self_exclusion : 1 })
                .then(function(response) {
                    if (response.get_self_exclusion) {
                        settingsData.max_balance = response.get_self_exclusion.max_balance;
                        settingsData.max_turnover = response.get_self_exclusion.max_turnover;
                        settingsData.max_losses = response.get_self_exclusion.max_losses;
                        settingsData.max_7day_turnover = response.get_self_exclusion.max_7day_turnover;
                        settingsData.max_7day_losses = response.get_self_exclusion.max_7day_losses;
                        settingsData.max_30day_turnover = response.get_self_exclusion.max_30day_turnover;
                        settingsData.max_30day_losses = response.get_self_exclusion.max_30day_losses;
                        settingsData.max_open_bets = response.get_self_exclusion.max_open_bets;
                        settingsData.session_duration_limit = response.get_self_exclusion.session_duration_limit;
                        settingsData.exclude_until = response.get_self_exclusion.exclude_until;
                    }
                })
                .catch(function (err) {
                    $.growl.error({ message: err.message });
                    console.error(err);
                });
    };

    var setOrRefreshTimer = function() {
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
