/**
 * Created by arnab on 4/5/16.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "lodash", 'common/rivetsExtra', 'moment', "jquery-growl", 'common/util'], function($, windows, liveapi, _, rv, moment) {

    var win = null, timerHandlerForSessionTimeout = null, loginTime = null;
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
            console.log('update self-exclusion : ', 0 < scope.max_balance , scope.max_balance <= 10000000000000000000);

            //validation
            if (scope.session_duration_limit && !_.inRange(scope.session_duration_limit, 0, 60481)) {
                $.growl.error({ message : 'Please enter value between 0 and 60480 for Session duration limit'.i18n() });
                return;
            }
            if (scope.exclude_until && moment.utc(scope.exclude_until, "YYYY-MM-DD").isBefore(moment.utc().startOf('day').add("months", 6))) {
                $.growl.error({ message : 'Exclude time cannot be less than 6 months'.i18n() });
                return;
            }
            if (scope.max_open_bets && !_.inRange(scope.max_open_bets, 0, 102)) {
                $.growl.error({ message : 'Please enter positive integer value between 0 and 101 for maximum open positions'.i18n() });
                return;
            }
            if (scope.max_balance && ! (0 < scope.max_balance &&  scope.max_balance <= 10000000000000000000)) {
                $.growl.error({ message : 'Please enter positive integer value between 0 and 10000000000000000000 for Maximum balance'.i18n() });
                return;
            }
            if (scope.max_30day_losses && !_.inRange(scope.max_30day_losses, 0, Number.MAX_VALUE)) {
                $.growl.error({ message : 'Please enter positive integer value for 30-day limit on losses'.i18n() });
                return;
            }
            if (scope.max_turnover && !_.inRange(scope.max_turnover, 0, Number.MAX_VALUE)) {
                $.growl.error({ message : 'Please enter positive integer value for Daily turnover limit'.i18n() });
                return;
            }
            if (scope.max_30day_turnover && !_.inRange(scope.max_30day_turnover, 0, Number.MAX_VALUE)) {
                $.growl.error({ message : 'Please enter positive integer value for 30-day turnover limit'.i18n() });
                return;
            }
            if (scope.max_7day_losses && !_.inRange(scope.max_7day_losses, 0, Number.MAX_VALUE)) {
                $.growl.error({ message : 'Please enter positive integer value for 7-day limit on losses'.i18n() });
                return;
            }
            if (scope.max_losses && !_.inRange(scope.max_losses, 0, Number.MAX_VALUE)) {
                $.growl.error({ message : 'Please enter positive integer value for Daily limit on losses'.i18n() });
                return;
            }
            if (scope.max_7day_turnover && !_.inRange(scope.max_7day_turnover, 0, Number.MAX_VALUE)) {
                $.growl.error({ message : 'Please enter positive integer value for 7-day turnover limit'.i18n() });
                return;
            }

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
                    $.growl.notice({ message : 'Your changes have been updated'.i18n() });
                    logoutBasedOnExcludeDate();
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
                var div = $(html).i18n();
                win = windows.createBlankWindow($('<div/>'), {
                    title: 'Self-Exclusion Facilities'.i18n(),
                    width: 900 ,
                    minHeight:500,
                    height: 500,
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

    function logoutBasedOnExcludeDate() {
        if (settingsData.exclude_until) {
            if (moment.utc(settingsData.exclude_until, 'YYYY-MM-DD').isAfter(moment.utc().startOf('day'))) {
                _.defer(function () {
                    $.growl.error( { message : 'You have excluded yourself until '.i18n() + settingsData.exclude_until });
                    liveapi.invalidate();
                });
            }
        }
    }

    var refreshData = function() {
        $.growl.notice({ message: 'Loading self-exclusion settings.'.i18n() });
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
                        logoutBasedOnExcludeDate();
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
                || !_.isFinite(_.toNumber(settingsData.session_duration_limit))) return;

        if (timerHandlerForSessionTimeout) clearTimeout(timerHandlerForSessionTimeout);
        var logoutAfter_ms = settingsData.session_duration_limit * 60 * 1000;
        //reduce time elapsed since login
        logoutAfter_ms -= _.now() - loginTime;
        //setTimeout works with 32 bit value. Anything more than that does not work. 32 bit value is around 49 days
        //User cannot be active on website for 49 days, so we are setting the session time out to 49 days max
        if (logoutAfter_ms > Math.pow(2, 32)) { logoutAfter_ms = Math.pow(2, 32); }
        timerHandlerForSessionTimeout = setTimeout(function() {
            $.growl.warning({ message : 'Logging out because of self-exclusion session time out!'.i18n() });
            liveapi.invalidate();
        }, logoutAfter_ms);

    };

    var logout = function() {
        if (win) win.dialog('destroy');
        win = null;
        if (timerHandlerForSessionTimeout) clearTimeout(timerHandlerForSessionTimeout)
        timerHandlerForSessionTimeout = null;
        loginTime = null;
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
        $("#nav-container a.selfexclusion").addClass('disabled');
    };

    liveapi.events.on('login', function(data) {
        liveapi.cached.authorize()
            .then(function(data) {
                if (!data.authorize.is_virtual) {
                    loginTime = _.now();
                    refreshData().then(function () {
                        setOrRefreshTimer();
                    });
                    $("#nav-container a.selfexclusion").removeClass('disabled');
                } else {
                    logout();
                }
            })
            .catch(function(err){
              logout();
            });
    });
    liveapi.events.on('logout', logout);

    return {
        /**
         * This method will load the dialog HTML and show to user
         * @param $menuLink
         */
        init : function($menuLink) {
            $menuLink.click(function () {
                if(!$(this).hasClass('disabled')) {
                    liveapi.cached.authorize()
                        .then(function () {
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
                }
            });
        }
    };

});
