/**
 * Created by amin on November 18, 2015.
 */

define(['jquery', 'windows/windows', 'rivets', 'text!trade/tradeDialog.html', 'css!trade/tradeDialog.css', 'jquery-ui'], function ($, windows, rv, $html) {

    $html = $($html);

    /* The symbol is in the following format:
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

    //var symbol = null, dict = null; // clean *contracts_for.available* into a dictionary object
    //var dialog = null; // trade dialog
    /* DOM elements that we need to query in this module */
    // TODO: make this variable local after development in done!
    window.dom = {
        root: $html,
        contract_category_display: null, // contract type drop down
        contract_displays: null,         // contract displays ul
        duration_select: null,                  // duration drop down
        duration_count: null,
        duration_unit: null
    };

    window.dict = null; // TODO: make this local after development

    // clean the data returend in *contracts_for.available*.
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

    function selectmenu(select, options /* = {render?:fn, initial?:'', change?:fn, array:[] */) {
        var render = options.render || function (v) { return v + ''; };
        select.children().remove();
        options.array.forEach(function (txt) {
            $('<option/>').val(txt).text(render(txt)).appendTo(select);
        });

        select.val(options.initial || options.array[0]);

        if (!select._initialized) {
            select._initialized = true;
            return select.selectmenu({ change: function () { options.change && options.change.call(this, select.val()); } });
        }

        return select.selectmenu('refresh');
    }

    state = {
        duration: {
            array: ['Duration', 'End Time'],
            value: 'Duration'
        },
        duration_unit: {
            array: ['ticks','seconds','minutes','hours','days'],
            value: 'ticks'
        },
        categories: {
            array: [],
            value: ''
        },
        category_displays: {
            array: [],
            selected: ''
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

    rv.formatters.eq = function (value, other) {
        console.warn('eq >', value, other);
        return value === other;
    }

    /* turn corrent select item into a jquery-ui-selectmenu, update value on change */
    rv.binders.selectmenu = {
        priority: 100,
        publishes: true,
        bind: function (el) {
            console.warn('selectmenu.bind()');
            var publish = this.publish.bind(this),
                select = $(el);
            select.selectmenu({
                change: function () {
                    var v = select.val();
                    publish(v);
                    select.trigger('change');
                }
            });
            select.selectmenu('refresh');
        },
        unbind: function(el){
            $(el).selectmenu( "destroy" )
        },
        routine: function (el, value) {
            $(el).val(value).selectmenu('refresh');
        }
    };
    /* refersh the selectmenu on array changes */
    rv.binders.selectrefresh = {
        priority: 99,
        routine: function(el,array) {
            console.warn('selectrefersh.routine()', array);
            $(el).selectmenu('refresh');
        }
    }


    function init(_symbol, contracts_for) {
        symbol = _symbol;
        dict = clean(contracts_for.available); // clean the data

        _contracts_for = contracts_for;

        dialog = windows.createBlankWindow($html, {
            title: symbol.display_name,
            resizable: false,
            collapsable: false,
            minimizable: false,
            maximizable: false,
            //height: 500
        });

        state.categories.array = dict.categories.slice(0);
        state.categories.value = state.categories.array[0];

        _view = rv.bind(dom.root[0],state)
        state.categories.onchange(); // trigger to init categories_display submenu

        dom.duration_count = dom.root.find('.duration-count').spinner({
            min: 0
        });

        dom.contract_displays = dom.root.find('.contract-displays');

        dialog.dialog('open');
    }

    return {
        init: init
    };
});
