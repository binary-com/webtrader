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

    var root = $($html);

    window.dict = null; // TODO: make this local after development

    /* clean the data returend in *contracts_for.available */
    function clean(available){
        var mapper = function(name) { return function(row) { return row[name]; }; };
        var filter = function(name,value) { return function(row) { return row[name] === value; }; };
        
        var ret = {
            categories: uniqueArray(available.map(mapper('contract_category_display'))),
            contract: {
                /*
                    categories[i] : {
                        contract_types: ["ASIANU", "ASIAND", "CALL", "PUT", "CALL", "PUT", "CALL", "PUT", "CALL", "PUT", "CALL", "PUT", "CALL", "PUT",
                                "DIGITMATCH", "DIGITDIFF", "DIGITODD", "DIGITEVEN", "DIGITOVER", "DIGITUNDER",
                                "EXPIRYMISS", "EXPIRYRANGE", "EXPIRYMISS", "EXPIRYRANGE", "SPREADU", "SPREADD", "RANGE", "UPORDOWN", "RANGE", "UPORDOWN", "ONETOUCH", "NOTOUCH", "ONETOUCH", "NOTOUCH"],
                        contract_displays: ["asian up", "asian down", "higher", "lower", "higher", "lower", "higher", "lower", "higher", "lower", "higher", "lower", "higher", "lower",
                                "matches", "differs", "odd", "even", "over", "under",
                                "ends outside", "ends between", "ends outside", "ends between", "spread up", "spread down", "stays between", "goes outside", "stays between", "goes outside", "touches", "does not touch", "touches", "does not touch"]
                    }
                */
            },
        };

        ret.categories.forEach(function (display) {
            var filtered = available.filter(filter('contract_category_display', display))
            var contract = ret.contract[display] = ret.contract[display] || {};
            contract.contract_types = uniqueArray( filtered.map(mapper('contract_type')) );
            contract.contract_displays = uniqueArray( filtered.map(mapper('contract_display')).map(capitalizeFirstLetter) );
        });

        return ret;
    }

    window.state = {
        duration: {
            array: ['Duration', 'End Time'],
            value: 'Duration'
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
        }
    };

    state.categories.onchange = function () {
        var name = state.categories.value;
        console.warn('state.categories.onchange() ', name);
        state.category_displays.array = dict.contract[name].contract_displays.slice(0);
        state.category_displays.selected = state.category_displays.array[0];
    };
    
    state.category_displays.onclick = function (e) {
        state.category_displays.selected = $(e.target).attr('data');
    };

    function init(_symbol, contracts_for) {
        symbol = _symbol;
        /* register for this symbol, TODO: don't register if already someone else has registered for this symbol */
        liveapi.send({ ticks: symbol.symbol }).catch(function (err) { console.warn(err); });
        liveapi.events.on('tick', function (data) {
            if (data.tick && data.tick.symbol == symbol.symbol) {
                state.tick.epoch = data.tick.epoch;
                state.tick.quote = data.tick.quote;
            }
        });

        dict = clean(contracts_for.available);  // clean the data

        window._contracts_for = contracts_for;

        dialog = windows.createBlankWindow(root, {
            title: symbol.display_name,
            resizable: false,
            collapsable: false,
            minimizable: false,
            maximizable: false,
            //height: 500
        });

        state.categories.array = dict.categories.slice(0);
        state.categories.value = 'Digits' || state.categories.array[0];

        window._view = rv.bind(root[0],state)
        state.categories.onchange();            // trigger change to init categories_display submenu

        dialog.dialog('open');
    }

    return {
        init: init
    };
});
