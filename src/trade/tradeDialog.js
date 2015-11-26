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
            array: ['ticks','seconds','minutes','hours','days'],
            value: 'ticks'
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
            value: '',
            array: [],
            visible: false,
        },
        proposal: {
            symbol: '-',
            contract_type: '-',
        },

    };

    state.categories.onchange = function () {
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

    state.date_start.update = function (forward_starting_options) {
        var model = state.date_start;
        if (!forward_starting_options) {
            state.date_start.visible = false;
            return;
        }
        state.date_start.visible = true;
    }

    state.category_displays.onchange = function () {
        console.warn('state.category_displays.onchange()', state.category_displays.selected)
        var filtered = available
                        .filter(filter('contract_category_display', state.categories.value))
                        .filter(filter('contract_display', state.category_displays.selected));
        state.proposal.contract_type = filtered.first().contract_type;

        /* Array of returned forward starting options */
        var forward_starting_options = filtered.filter(filter('start_type', 'forward')).first()
        state.date_start.update(forward_starting_options && forward_starting_options.forward_starting_options);

        console.warn('state.category_displays.onchange()',filtered);
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
        state.categories.onchange();            // trigger change to init categories_display submenu

        dialog.dialog('open');
    }

    return {
        init: init
    };
});
