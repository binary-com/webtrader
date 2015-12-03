/**
 * Created by amin on November 18, 2015.
 */

/* init(...) parameters => The symbol is in the following format:
     symbol = {
        symbol: "frxXAUUSD",
        display_name: "Gold/USD",
        delay_amount: 0,
        settlement: "",
        feed_license: "realtime",
        events: [{ dates: "Fridays", descrip: "Closes early (at 21:00)" }, { dates: "2015-11-26", descrip: "Closes early (at 18:00)" }],
        times: { open: ["00:00:00"], close: ["23:59:59"], settlement: "23:59:59" }
      },

  The contracts_for is in the following format:
    contracts_for = {
        open: 1447801200,
        close: 1447822800,
        hit_count: 14,
        spot: "5137.20",
        available: [
            {
                market: "indices",                  contract_display: "higher",
                min_contract_duration: "1d",        max_contract_duration: "365d",
                barriers: 0,                        sentiment: "up",
                barrier_category: "euro_atm",       start_type: "spot",
                contract_category: "callput",       submarket: "asia_oceania",
                exchange_name: "ASX",               expiry_type: "daily",
                underlying_symbol: "AS51",          contract_category_display: "Up/Down",
                contract_type: "CALL"
            }]
    }
*/

define(['jquery', 'windows/windows', 'common/rivetsExtra', 'websockets/binary_websockets', 'text!trade/tradeDialog.html', 'css!trade/tradeDialog.css', 'timepicker', 'jquery-ui'],
    function ($, windows, rv, liveapi, html) {

    var mapper = function(name) { return function(row) { return row[name]; }; };
    var filter = function(name,value) { return function(row) { return row[name] === value; }; };
    var replacer = function (field_name, value) { return function (obj) { obj[field_name] = value; return obj; }; };

    var root = $(html);
    window.available = null;

    window.state = {
        duration: {
            array: ['Duration', 'End Time'],
            value: 'Duration',
        },
        duration_unit: {
            array: [{ type: '', min: 1, max:365 }],
            value: '',
        },
        duration_count: {
            value: 1,
            min: 1,
            max: 365
        },
        date_start: {
            value: 'now', /* epoch value if selected */
            array: [{ text: 'Now', value: 'now' } ],
            visible: false,
        },

        date_expiry: {
            value_date: new Date().toISOString().split('T')[0], /* today utc in yyyy-mm-dd format */
            value_hour: new Date().toISOString().split('T')[1].slice(0,5), /* now utc in hh:mm format */
            value: 0,    /* epoch value of date+hour */
        },
        categories: {
            array: [],
            value: '',
            paddingTop: function(){
                var paddings = { "Asians" : '17px', "Up/Down" : '12px', "Digits" : '12px', "In/Out" : '1px', "Touch/No Touch" : '12px' };
                return paddings[state.categories.value] || '3px';
            }
        },
        category_displays: {
            array: [],
            selected: ''
        },
        barriers: {
            barrier_count: 0,
            barrier : '+0.00000',
            high_barrier: '+0.00000',
            low_barrier: '-0.00000',
            barrier_live: function() { return this.barrier * 1 + state.tick.quote * 1; },
            high_barrier_live: function() { return this.high_barrier * 1 + state.tick.quote * 1; },
            low_barrier_live: function() { return this.low_barrier * 1 + state.tick.quote * 1; },
        },
        digits: {
            value: '0',
        },
        currency: {
            array: ['USD'],
            value: 'USD',
        },
        basis: {
            array: ['Payout', 'Stake'],
            value: 'payout',
            amount: 10,
            limit: null,
        },
        tick: {
            epoch: '0',
            quote:'0'
        },
        proposal: {
            symbol: '-',
            ids: [], /* Id of proposal stream, Must have only one stream, however use an array to handle multiple requested streams. */

            ask_price: "0.0",
            date_start: 0,
            display_value: "0.0",
            message: 'loading ...', /* longcode */
            payout: 0,
            spot: "0.0",
            spot_time: "0",
            error: '',

            /* computed properties */
            netprofit_: function () {
                return state.currency.value + ' ' + ((this.payout - this.ask_price) || 0).toFixed(2);
            },
            return_: function () {
                var ret = (((this.payout - this.ask_price) / this.ask_price) || 0).toFixed(2) ;
                return (ret* 100 | 0) + '%';
            }
        },
        tooltips: {
            barrier: { my: "left-215 top+10", at: "left bottom", collision: "flipfit" },
            barrier_p: { my: "left-5 top+10", at: "left bottom", collision: "flipfit" },
        }
    };
    state.barriers.root = state; // reference to root object for computed properties

    state.categories.update = function () {
        var name = state.categories.value;
        state.category_displays.array = available
                                            .filter(filter('contract_category_display', name))
                                            .map(mapper('contract_display'))
                                            .unique();
        state.category_displays.selected = state.category_displays.array[0];
    };

    state.category_displays.onclick = function (e) {
        state.category_displays.selected = $(e.target).attr('data');
    };

    state.date_start.update = function () {
        var forward_starting_options = available.filter(filter('contract_category_display', state.categories.value))
                                                .filter(filter('contract_display', state.category_displays.selected))
                                                .filter(filter('start_type', 'forward')).first();
        if (!forward_starting_options) {
            state.date_start.visible = false;
            state.date_start.array = [];
            state.date_start.value = 'now';
            return;
        };
        forward_starting_options = forward_starting_options.forward_starting_options
        var model = state.date_start;
        var array = [{ text: 'Now', value: 'now' }];
        forward_starting_options.forEach(function (row) {
            var step = 5 * 60; // 5 minutes step
            var from = Math.ceil(Math.max(new Date().getTime() / 1000, row.open) / step) * step;
            to = row.close;
            for (var epoch = from; epoch < to; epoch += step) {
                var d = new Date(epoch * 1000);
                var text = ("00" + d.getUTCHours()).slice(-2) + ":" +
                       ("00" + d.getUTCMinutes()).slice(-2) + ' ' +
                       ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
                array.push({ text: text, value: epoch });
            }
        });
        state.date_start.value = 'now';
        state.date_start.array = array;
        state.date_start.visible = true;
    };

    state.date_expiry.update = function () {
        var yyyy_mm_dd = state.date_expiry.value_date,
            hh_mm = state.date_expiry.value_hour;
        var ymd = yyyy_mm_dd.split('-'),
            hm = hh_mm.split(':'),
            year = ymd[0] * 1,
            month = ymd[1] * 1 - 1,
            day = ymd[2] * 1,
            hour = hm[0] * 1,
            minute = hm[1] * 1;
        state.date_expiry.value = Date.UTC(year, month, day, hour, minute) / 1000;
    }

    state.duration.update = function () {
        var category = state.categories.value;
        if (["Up/Down", "In/Out", "Touch/No Touch"].contains(category))
            state.duration.array.length !== 2 && (state.duration.array = ['Duration', 'End Time'])
        else {
            state.duration.value !== 'Duration' && (state.duration.value = 'Duration');
            state.duration.array.length !== 1 && (state.duration.array = ['Duration'])
        }
    };

    state.duration_unit.update = function () {
        var start_type = state.date_start.value !== 'now' ? 'forward' : 'spot';
        var durations = available.filter(filter('contract_category_display', state.categories.value))
                                                .filter(filter('contract_display', state.category_displays.selected))
                                                .filter(filter('start_type', start_type))
                                                .map(function (r) { return { min: r.min_contract_duration, max: r.max_contract_duration, type: r.expiry_type }; });
        var array = [];
        durations.forEach(function (d) {
            if (['tick', 'daily'].contains(d.type)) {
                array.push({
                    min: (d.min + '').replace('d', '') | 0,
                    max: (d.max + '').replace('d', '') | 0,
                    type: { tick: 'ticks', daily: 'days' }[d.type]
                });
                return;
            }
            /* fix intraday duration intervals */
            var min = d.min.replace('s', '').replace('m', ''),
                max = d.max.replace('s', '').replace('m', '').replace('d', '');

            min *= { 's': 1, 'm': 60 }[d.min.last()];                 // convert to seconds
            max *= { 's': 1, 'm': 60, 'd': 3600 * 24 }[d.max.last()];

            's' === d.min.last() && array.push({
                min: min,
                max: max,
                type: 'seconds'
            });
            ['s', 'm'].contains(d.min.last()) && max >= 60 && array.push({
                min: Math.max(min / 60, 1),
                max: max / 60,
                type: 'minutes'
            });
            ['s', 'm'].contains(d.min.last()) && max >= 3600 && array.push({
                min: Math.max(min / 3600, 1),
                max: max / 3600,
                type: 'hours'
            });
        });
        array.sort(function (r1, r2) {
            var dict = { 'ticks': 0, 'seconds': 1, 'minutes': 2, 'hours': 3, 'days': 4 };
            return dict[r1.type] - dict[r2.type];
        })

        if (!array.length) {
            state.barriers.update();
            return;
        }

        state.duration_unit.array = array;
        if (!array.map(mapper('type')).contains(state.duration_unit.value))
            state.duration_unit.value = array.first().type;
        else {
            /* manual notify 'duration_count' and 'barriers' to update themselves */
            state.duration_count.update();
            state.barriers.update();
        }
    };

    state.duration_count.update = function () {
        var range = state.duration_unit.array.filter(filter('type', state.duration_unit.value)).first();
        if (!range) return;
        state.duration_count.min = range.min;
        state.duration_count.max = range.max;
        var value = state.duration_count.value;
        state.duration_count.value = Math.min(Math.max(value, range.min), range.max);
    };

    state.barriers.update = function () {
        var unit = state.duration_unit.value;
        var expiry_type = ['seconds', 'minutes', 'hours'].contains(unit) ? 'intraday' : unit === 'days' ? 'daily' : 'tick';
        var barriers = available.filter(filter('contract_category_display', state.categories.value))
                                                .filter(filter('contract_display', state.category_displays.selected))
                                                .filter(filter('expiry_type',expiry_type))
                                                .filter(function (r) { return r.barriers >= 1; })
                                                .first();
        state.barriers.barrier_count = barriers ? barriers.barriers : 0;
        if (!barriers)
            return;

        state.barriers.barrier = (barriers.barrier || '+0.00000') * 1;
        state.barriers.high_barrier = '' + (barriers.high_barrier || '+0.00000') * 1;
        state.barriers.low_barrier = '' + (barriers.low_barrier || '-0.00000') * 1;
    };

    state.basis.update_limit = function () {
        var basis = state.basis;
        var limit = available.filter(filter('contract_category_display', state.categories.value))
                                                .filter(filter('contract_display', state.category_displays.selected))
                                                .first();
        limit = (limit && limit.payout_limit) || null;
        basis.limit = limit ? (limit | 0) : null;
        basis.limit && (basis.amount = Math.min(basis.amount, basis.limit));
    };

    state.proposal.onchange = function () {
        var unit = state.duration_unit.value;
        var expiry_type = ['seconds', 'minutes', 'hours'].contains(unit) ? 'intraday' : unit === 'days' ? 'daily' : 'tick';
        var row = available.filter(filter('contract_category_display', state.categories.value))
                           .filter(filter('contract_display', state.category_displays.selected))
                           .filter(filter('expiry_type', expiry_type))
                           .first();
        var request = {
            proposal: 1,
            amount: state.basis.amount, /* Proposed payout or stake value */
            basis: state.basis.value, /* Indicate whether amount is 'payout' or 'stake */
            contract_type: row.contract_type,
            currency: state.currency.value, /* This can only be the account-holder's currency */
            symbol: state.proposal.symbol, /* Symbol code */
        };
        /* set the value for barrier(s) */
        if (state.barriers.barrier_count == 1) {
            request.barrier = '+' + state.barriers.barrier;
        }
        if (state.barriers.barrier_count == 2) {
            request.barrier = '+' + state.barriers.high_barrier;
            request.barrier2 = state.barriers.low_barrier + '';
        }
        if (state.categories.value === 'Digits') {
            request.barrier = state.digits.value + '';
        }
        if (state.date_start.value !== 'now') {
            request.date_start = state.date_start.value * 1;
        }
        /* set value for duration or date_expiry */
        if (state.duration.value === 'Duration') {
            request.duration_unit = state.duration_unit.value.first(); //  (d|h|m|s|t), Duration unit is s(seconds), m(minutes), h(hours), d(days), t(ticks)
            request.duration = state.duration_count.value * 1;
        }
        else {
            request.date_expiry = state.date_expiry.value;
        }

        /* forget requested streams */
        while (state.proposal.ids.length) {
            var id = state.proposal.ids.shift();
            liveapi.send({ forget: id });
            console.warn('forget: ', id);
        }

        liveapi.send(request)
               .then(function (data) {
                   var id = data.proposal.id;
                   state.proposal.ids.push(id);
                   state.proposal.error = '';
                   console.warn('registered: ', id);
               })
               .catch(function (err) {
                   console.error(err);
                   state.proposal.error = err.message;
               });
    };

    function init(symbol, contracts_for) {
        window.contracts_for = contracts_for;
        available = contracts_for.available;

        state.proposal.symbol = symbol.symbol;
        /* register for this symbol, TODO: don't register if already someone else has registered for this symbol */
        liveapi.send({ ticks: symbol.symbol }).catch(function (err) { console.error(err); });
        liveapi.events.on('tick', function (data) {
            if (data.tick && data.tick.symbol == symbol.symbol) {
                state.tick.epoch = data.tick.epoch;
                state.tick.quote = data.tick.quote;
            }
        });

        /* register for proposal event */
        liveapi.events.on('proposal', function (data) {
            if (data.echo_req.symbol !== state.proposal.symbol)
                return;
            /* update fields */
            var proposal = data.proposal;
            state.proposal.ask_price = proposal.ask_price;
            state.proposal.date_start = proposal.date_start;
            state.proposal.display_value = proposal.display_value;
            state.proposal.message = proposal.longcode;
            state.proposal.payout = proposal.payout;
            state.proposal.spot = proposal.spot;
            state.proposal.spot_time = proposal.spot_time;
        });

        /* fix for server side api, not seperating higher/lower frim rise/fall in up/down category */
        available.filter(filter('contract_category_display','Up/Down'))
                 .filter(filter('barrier_category', 'euro_atm'))
                 .filter(filter('contract_display', 'higher'))
                 .forEach(replacer('contract_display','rise'));
        available.filter(filter('contract_category_display','Up/Down'))
                 .filter(filter('barrier_category', 'euro_atm'))
                 .filter(filter('contract_display', 'lower'))
                 .forEach(replacer('contract_display','fall'));
        /* fix for server side api, returning two different contract_category_displays for In/Out */
        available.filter(filter('contract_category_display', 'Stays In/Goes Out'))
                 .forEach(replacer('contract_category_display', 'In/Out'));
        available.filter(filter('contract_category_display', 'Ends In/Out'))
                 .forEach(replacer('contract_category_display', 'In/Out'));
        /* fix for websocket having a useless barrier value for digits */
        available.filter(filter('contract_category_display', 'Digits'))
                 .forEach(replacer('barriers', 0));
        /* fix for contract_display text in In/Out menue */
        available.filter(filter('contract_display', 'ends outside')).forEach(replacer('contract_display', 'ends out'));
        available.filter(filter('contract_display', 'ends between')).forEach(replacer('contract_display', 'ends in'));
        available.filter(filter('contract_display', 'stays between')).forEach(replacer('contract_display', 'stays in'));
        available.filter(filter('contract_display', 'goes outside')).forEach(replacer('contract_display', 'goes out'));
        available.filter(filter('contract_display', 'touches')).forEach(replacer('contract_display', 'touch'));
        available.filter(filter('contract_display', 'does not touch')).forEach(replacer('contract_display', 'no touch'));
        /* Digits odd/even/over/under are not yet implemented in beta trading interface ignore them for now, TODO: implement them */
        available = available.filter(function (r) { return !['odd', 'even', 'over', 'under'].contains(r.contract_display); });
        /* Spreads are not yet implemented, ignore them for now, TODO: itempement Spreads */
        available = available.filter(function (r) { return r.contract_category_display !== 'Spreads'; });

        dialog = windows.createBlankWindow(root, {
            title: symbol.display_name,
            resizable: false,
            collapsable: false,
            minimizable: false,
            maximizable: false,
            //height: 500
        });

        state.categories.array = available.map(mapper('contract_category_display')).unique();
        state.categories.value = state.categories.array.indexOf('Up/Down') >= 0 ? 'Up/Down' : state.categories.array[0]; // TODO: show first tab

        window._view = rv.bind(root[0],state)
        state.categories.update();            // trigger update to init categories_display submenu

        dialog.dialog('open');
    }

    return {
        init: init
    };
});
