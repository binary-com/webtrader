/**
 * Created by arnab on 4/5/16.
 */
import $ from "jquery";
import windows from "windows/windows";
import liveapi from "websockets/binary_websockets";
import _ from "lodash";
import rv from "common/rivetsExtra";
import moment from "moment";
import html from "text!selfexclusion/selfexclusion.html";
import "jquery-growl";
import "common/util";


let win = null,
    timerHandlerForSessionTimeout = null,
    loginTime = null;
const limits = {
    "max_balance": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "Maximum balance".i18n()
    },
    "max_turnover": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "Daily turnover limit".i18n()
    },
    "max_losses": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "Daily limit on losses".i18n()
    },
    "max_7day_turnover": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "7-day turnover limit".i18n()
    },
    "max_7day_losses": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "7-day limit on losses".i18n()
    },
    "max_30day_turnover": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "30-day turnover limit".i18n()
    },
    "max_30day_losses": {
        "limit": 99999999999999999999,
        "set": false,
        "name": "30-day limit on losses".i18n()
    },
    "max_open_bets": {
        "limit": 101,
        "set": false,
        "name": "Maximum open positions".i18n()
    },
    "session_duration_limit": {
        "limit": 60480,
        "set": false,
        "name": "Session duration limit".i18n()
    },
    "exclude_until": {
        "limit": null,
        "set": false,
        "name": "Exclude time".i18n()
    },
    "timeout_until": {
        "limit": null,
        "set": false,
        "name": "Time out until".i18n()
    }
};

const settingsData = {
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
    update: function(event, scope) {

        const data = { "set_self_exclusion": 1 };
        let message = [];

        if (scope.timeout_until_date) {
            const time_out = moment(scope.timeout_until_date);
            if (scope.timeout_until_time) {
                time_out.add(scope.timeout_until_time.format('HH'), 'hours')
                    .add(scope.timeout_until_time.format('mm'), 'minutes')
            }
            if (time_out.isAfter(moment().add(6, "weeks"))) {
                message.push("Please enter a value less than 6 weeks for time out until.".i18n());
            }
            if (!time_out.isAfter(moment())) {
                message.push("Exclude time must be after today.".i18n());
            }
            scope.timeout_until = time_out.unix();
        } else {
            if (scope.timeout_until_time) {
                message.push("Please select a date for time out until.".i18n());
            }
        }


        //validation
        $.each(limits, function(index, value) {
            if (scope[index] || value.set) {
                if (index === "exclude_until" && moment.utc(scope.exclude_until, "YYYY-MM-DD").isBefore(moment.utc().startOf('day').add(6, "months"))) {
                    message.push("Exclude until time cannot be less than 6 months.".i18n());
                    return;
                }
                if (!scope[index] || scope[index] <= 0 || (value.limit && scope[index] > value.limit)) {
                    message.push("Please enter a value between 0 and ".i18n() + value.limit + " for ".i18n() + value.name);
                    return;
                }
                data[index] = scope[index];
            }
        });

        if (message.length > 0) {
            message.forEach(function(msg, i) {
                $.growl.error({ message: msg });
            })
            return;
        }
        if (data.timeout_until || data.exclude_until) {
            const confirm = window.confirm("When you click \"Ok\" you will be excluded from trading on the site until the selected date.".i18n());
            if (confirm == false) {
                return;
            }
        }

        liveapi.send(data)
            .then(function(response) {
                $.growl.notice({ message: 'Your changes have been updated'.i18n() });
                logoutBasedOnExcludeDateAndTimeOut();
                setOrRefreshTimer();
            })
            .catch(function(err) {
                $.growl.error({ message: err.message });
                console.error(err);
            });
    }
};

const init_win = function() {
    require(["css!selfexclusion/selfexclusion.css"]);
    return new Promise(function(res) {
        const div = $(html).i18n();
        div.find(".datepicker").datepicker({
            dateFormat: 'yy-mm-dd',
            minDate: moment.utc().toDate(),
            maxDate: moment.utc().add(6, "weeks").toDate()
        });
        div.find(".timepicker").timepicker({
            timeFormat: 'HH:MM'
        });
        win = windows.createBlankWindow($('<div/>'), {
            title: 'Self-Exclusion Facilities'.i18n(),
            width: 900,
            minHeight: 500,
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
            _.defer(function() {
                $.growl.error({ message: 'You have excluded yourself until '.i18n() + settingsData.exclude_until });
                liveapi.invalidate();
            });
        }
    }
    if (settingsData.timeout_until) {
        if (moment(settingsData.timeout_until).isAfter(moment().unix().valueOf())) {
            $.growl.error({ message: 'You have excluded yourself until '.i18n() + moment.unix(settingsData.timeout_until).utc().format("YYYY-MM-DD HH:mm") + "GMT" });
            liveapi.invalidate();
        }
    }
}

const refreshData = function() {
    $.growl.notice({ message: 'Loading self-exclusion settings.'.i18n() });
    return liveapi
        .send({ get_self_exclusion: 1 })
        .then(function(response) {
            if (response.get_self_exclusion) {
                $.each(limits, function(index, value) {
                    settingsData[index] = response.get_self_exclusion[index];
                    if (response.get_self_exclusion[index]) {
                        limits[index].limit = response.get_self_exclusion[index];
                        limits[index].set = true;
                    }
                });

                logoutBasedOnExcludeDateAndTimeOut();
            }
        })
        .catch(function(err) {
            $.growl.error({ message: err.message });
            console.error(err);
        });
};

const setOrRefreshTimer = function() {

    if (_.isUndefined(settingsData.session_duration_limit) || _.isNull(settingsData.session_duration_limit) || !_.isFinite(_.toNumber(settingsData.session_duration_limit))) return;

    if (timerHandlerForSessionTimeout) clearTimeout(timerHandlerForSessionTimeout);
    let logoutAfter_ms = settingsData.session_duration_limit * 60 * 1000;
    //reduce time elapsed since login
    logoutAfter_ms -= _.now() - loginTime;
    //setTimeout works with 32 bit value. Anything more than that does not work. 32 bit value is around 49 days
    //User cannot be active on website for 49 days, so we are setting the session time out to 49 days max
    if (logoutAfter_ms > Math.pow(2, 32)) { logoutAfter_ms = Math.pow(2, 32); }
    timerHandlerForSessionTimeout = setTimeout(function() {
        $.growl.warning({ message: 'Logging out because of self-exclusion session time out!'.i18n() });
        liveapi.invalidate();
    }, logoutAfter_ms);

};

const logout = function() {
    if (win) win.dialog('destroy');
    win = null;
    if (timerHandlerForSessionTimeout) clearTimeout(timerHandlerForSessionTimeout)
    timerHandlerForSessionTimeout = null;
    loginTime = null;
    settingsData.max_balance = null;
    settingsData.max_turnover = null;
    settingsData.max_losses = null;
    settingsData.max_7day_turnover = null;
    settingsData.max_7day_losses = null;
    settingsData.max_30day_turnover = null;
    settingsData.max_30day_losses = null;
    settingsData.max_open_bets = null;
    settingsData.session_duration_limit = null;
    settingsData.exclude_until = null;
    $("#nav-container a.selfexclusion").addClass('disabled');
};

liveapi.events.on('login', function(data) {
    liveapi.cached.authorize()
        .then(function(data) {
            if (!data.authorize.is_virtual) {
                loginTime = _.now();
                refreshData().then(function() {
                    setOrRefreshTimer();
                });
                $("#nav-menu a.selfexclusion").removeClass('disabled');
            } else {
                logout();
            }
        })
        .catch(function(err) {
            logout();
        });
});
liveapi.events.on('logout', logout);

export const init = function($menuLink) {
    $menuLink.click(function() {
        if (!$(this).hasClass('disabled')) {
            liveapi.cached.authorize()
                .then(function() {
                    if (!win) {
                        init_win().then(function() {
                            win.dialog('open');
                        });
                    } else {
                        refreshData();
                        win.moveToTop();
                    }
                })
                .catch(function(err) {
                    console.error(err);
                });
        }
    });
}

export default {
    init
}
