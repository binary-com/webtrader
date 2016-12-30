/**
 * Created by arnab on 4/5/16.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "lodash", 'common/rivetsExtra', 'moment', 'text!selfexclusion/selfexclusion.html', "jquery-growl", 'common/util'], function($, windows, liveapi, _, rv, moment, html) {

    var win = null, timerHandlerForSessionTimeout = null, loginTime = null;
    var limits = {
      "max_balance": {
        "limit": 10000000000000000000,
        "set": false,
        "name": "Maximum balance"
      },
      "max_turnover": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "Daily turnover limit"
      },
      "max_losses": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "Daily limit on losses"
      },
      "max_7day_turnover": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "7-day turnover limit"
      },
      "max_7day_losses": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "7-day limit on losses"
      },
      "max_30day_turnover": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "30-day turnover limit"
      },
      "max_30day_losses": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "30-day limit on losses"
      },
      "max_open_bets": {
        "limit": 101,
        "set": false,
        "name": "Maximum open positions"
      },
      "session_duration_limit": {
        "limit": 60480,
        "set": false,
        "name": "Session duration limit"
      },
      "exclude_until": {
        "limit": null,
        "set": false,
        "name": "Exclude time"
      },
      "timeout_until": {
        "limit": null,
        "set": false,
        "name": "Time out until"
      }
    };

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
        timeout_until_date: null,
        timeout_until_time: null,
        update : function(event, scope) {

            var data = {"set_self_exclusion": 1};
            var check_passed = true;

            if(scope.timeout_until_date && scope.timeout_until_time){
                var time_out = moment(scope.timeout_until_date + " " + scope.timeout_until_time, "YYYY-MM-DD hh:mm");
                if(time_out.isAfter(moment().add(6,"weeks"))){
                    check_passed = false;
                    $.growl.error({message: "Please enter a value less than 6 weeks for time out until."});
                }
                scope.timeout_until = time_out.unix().valueOf();
            } else {
                if(scope.timeout_until_date || scope.timeout_until_time){
                    check_passed = false;
                    $.growl.error({message:"Please enter both date and time for Time out until."});
                }
            }
            //validation
            $.each(limits, function(index, value){
                if(scope[index] || value.set){
                    if(index === "exclude_until" && moment.utc(scope.exclude_until, "YYYY-MM-DD").isBefore(moment.utc().startOf('day').add(6, "months"))){
                        var message = "Exclude until time cannot be less than 6 months.";
                        check_passed = false;
                        $.growl.error({ message: message});
                        return;
                    } 

                    if(!scope[index] || scope[index] <= 0 || (value.limit && scope[index] > value.limit)){
                        var message = "Please enter a value between 0 and " + value.limit + " for " + value.name;
                        check_passed = false;
                        $.growl.error({ message: message});
                        return;
                    }
                    data[index] = scope[index];
                }
            });

            if(!check_passed)
                return;

            liveapi.send(data)
                .then(function(response) {
                    $.growl.notice({ message : 'Your changes have been updated'.i18n() });
                    logoutBasedOnExcludeDateAndTimeOut();
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
            var div = $(html).i18n();
            div.find(".datepicker").datepicker({
                dateFormat : 'yy-mm-dd',
                minDate: moment.utc().toDate(),
                maxDate: moment.utc().add(6,"weeks").toDate()
            });
            div.find(".timepicker").timepicker({
                timeFormat : 'HH:MM'
            });
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
    };

    function logoutBasedOnExcludeDateAndTimeOut() {
        if (settingsData.exclude_until) {
            if (moment.utc(settingsData.exclude_until, 'YYYY-MM-DD').isAfter(moment.utc().startOf('day'))) {
                _.defer(function () {
                    $.growl.error( { message : 'You have excluded yourself until '.i18n() + settingsData.exclude_until });
                    liveapi.invalidate();
                });
            }
        }
        if (settingsData.timeout_until) {
            if (moment(settingsData.timeout_until).isAfter(moment().unix().valueOf())) {
                $.growl.error( { message : 'You have excluded yourself until '.i18n() + moment.unix(settingsData.timeout_until).utc().format("YYYY-MM-DD HH:mm") + "GMT" });
                liveapi.invalidate();
            }
        }
    }

    var refreshData = function() {
        $.growl.notice({ message: 'Loading self-exclusion settings.'.i18n() });
        return liveapi
                .send({ get_self_exclusion : 1 })
                .then(function(response) {
                    if (response.get_self_exclusion) {   
                        $.each(limits, function(index, value){
                            settingsData[index] = response.get_self_exclusion[index];
                            if(response.get_self_exclusion[index]){
                                limits[index].limit = response.get_self_exclusion[index];
                                limits[index].set = true;
                            }
                        });

                        logoutBasedOnExcludeDateAndTimeOut();
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
                    $("#nav-menu a.selfexclusion").removeClass('disabled');
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
