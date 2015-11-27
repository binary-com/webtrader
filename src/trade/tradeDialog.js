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
    function ($, windows, rv, liveapi, $html) {

    var mapper = function(name) { return function(row) { return row[name]; }; };
    var filter = function(name,value) { return function(row) { return row[name] === value; }; };
    var replacer = function (field_name, value) { return function (obj) { obj[field_name] = value; return obj; }; };

    var root = $($html);
    window.available = null;

    window.state = {
        duration: {
            array: ['Duration', 'End Time'],
            value: 'Duration',
            expiry: '',
        },
        duration_unit: {
            array: [{ type: '' }],
            value: '',
        },
        duration_count: {
            value: 1,
            min: 1,
            max: 365
        },
        categories: {
            array: [],
            value: ''
        },
        category_displays: {
            array: [],
            selected: ''
        },
        endtime_date: {
            value: new Date(),
            numberOfMonths: 1,
            styles: {
                marginTop: '3px',
                marginLeft: '-50px'
            }
        },
        endtime_hour: {
            value: '04:00',
        },
        digits: {
            value: '0',
        },
        currency: {
            array: ['USD'],
            vlaue: 'USD',
        },
        basis: {
            array: ['Payout', 'Stake'],
            value: 'payout',
            amount: 10,
        },
        tick: {
            epoch: '0',
            quote:'-'
        },
        date_start: {
            value: 'now',
            array: [{ text: 'Now', value: 'now' } ],
            visible: false,
        },
        proposal: {
            symbol: '-',
            contract_type: '-',
        },

    };

    state.categories.update = function () {
        var name = state.categories.value;
        console.warn('state.categories.onchange() ', name);
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
        var array = [{ text: 'Now', value: 'now' } ];
        forward_starting_options.forEach(function (row) {
            var step = 5*60; // 5 minutes step
            var from = Math.ceil(Math.max(new Date().getTime() / 1000, row.open) / step) * step;
                to = row.close;
            for (var epoch = from; epoch < to; epoch += step) {
                var d = new Date(epoch * 1000);
                var text = ("00" + d.getUTCHours()).slice(-2) + ":" +
                       ("00" + d.getUTCMinutes()).slice(-2)  + ' ' +
                       ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
                array.push({ text: text, value: epoch });
            }
        });
        state.date_start.value = 'now';
        state.date_start.array = array;
        state.date_start.visible = true;
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
        var durations = available.filter(filter('contract_category_display', state.categories.value))
                                                .filter(filter('contract_display', state.category_displays.selected))
                                                .filter(filter('start_type', 'spot'))
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
            ['s','m'].contains(d.min.last()) && max >= 60 && array.push({
                min: Math.max(min/60, 1),
                max: max/60,
                type: 'minutes'
            });
            ['s','m'].contains(d.min.last()) && max >= 3600 && array.push({
                min: Math.max(min/3600,1),
                max: max/3600,
                type: 'hours'
            });
        });
        array.sort(function (r1, r2) {
            var dict = { 'ticks': 0, 'seconds': 1, 'minutes': 2, 'hours': 3, 'days': 4 };
            return dict[r1.type] - dict[r2.type];
        })

        state.duration_unit.array = array;
        if(!array.map(mapper('type')).contains(state.duration_unit.value))
            state.duration_unit.value = array.first().type;
    }
    state.proposal.onchange = function () {
        var request = {
            proposal: 1,

        };
        console.warn('state.proposal.onchange(...)', arguments);
    }

    function init(symbol, contracts_for) {
        window.contracts_for = contracts_for;
        available = contracts_for.available;

        state.proposal.symbol = symbol;
        /* register for this symbol, TODO: don't register if already someone else has registered for this symbol */
        liveapi.send({ ticks: symbol.symbol }).catch(function (err) { console.warn(err); });
        liveapi.events.on('tick', function (data) {
            if (data.tick && data.tick.symbol == symbol.symbol) {
                state.tick.epoch = data.tick.epoch;
                state.tick.quote = data.tick.quote;
            }
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
        /* fix for contract_display text in In/Out menue */
        available.filter(filter('contract_display', 'ends outside')).forEach(replacer('contract_display', 'ends out'));
        available.filter(filter('contract_display', 'ends between')).forEach(replacer('contract_display', 'ends in'));
        available.filter(filter('contract_display', 'stays between')).forEach(replacer('contract_display', 'stays in'));
        available.filter(filter('contract_display', 'goes outside')).forEach(replacer('contract_display', 'goes out'));
        available.filter(filter('contract_display', 'touches')).forEach(replacer('contract_display', 'touch'));
        available.filter(filter('contract_display', 'does not touch')).forEach(replacer('contract_display', 'no touch'));

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
