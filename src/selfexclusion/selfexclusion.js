/**
 * Created by arnab on 4/5/16.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "lodash", 'common/rivetsExtra', "jquery-growl"], function($, windows, liveapi, _, rv) {

    var win = null;
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

            //Validate inputs
            if (!_.isNumber(data.session_duration_limit)) {
                $.growl.error({ message : "Number only for Session duration limit" });
                return;
            } else if (!_.isNumber(data.max_open_bets)) {
                $.growl.error({ message : "Number only for Maximum number of open positions" });
                return;
            } else if (!_.isNumber(data.max_balance)) {
                $.growl.error({ message : "Number only for Maximum account cash balance" });
                return;
            } else if (!_.isNumber(data.max_30day_losses)) {
                $.growl.error({ message : "Number only for Maximum aggregate loss over a 30-day period" });
                return;
            } else if (!_.isNumber(data.max_turnover)) {
                $.growl.error({ message : "Number only for Maximum aggregate contract purchases per day" });
                return;
            } else if (!_.isNumber(data.max_30day_turnover)) {
                $.growl.error({ message : "Number only for Maximum aggregate contract purchases over a 30-day period" });
                return;
            } else if (!_.isNumber(data.max_7day_losses)) {
                $.growl.error({ message : "Number only for Maximum aggregate contract purchases over a 7-day period" });
                return;
            } else if (!_.isNumber(data.max_losses)) {
                $.growl.error({ message : "Number only for Maximum aggregate loss per day" });
                return;
            } else if (!_.isNumber(data.max_7day_turnover)) {
                $.growl.error({ message : "Number only for Maximum aggregate contract purchases over a 7-day period" });
                return;
            }

            liveapi.send(data)
                .then(function(response) {
                    $.growl.notice({ message : "Your changes have been updated" });
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
        $.growl.notice({ message: "Refreshing settings!" });
        liveapi
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

    return {
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
