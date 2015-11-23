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

    var events = {
        contract_category_display: { }
    };

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

    events.contract_category_display.change = function () {
        var ccd = dom.contract_category_display;
        var cds = dom.contract_displays;
        var name = ccd.find('option:selected').val(); // available[i].contract_category_display

        console.warn(dict.contract[name]);

        cds.empty(); // clear the list
        dict.contract[name].contract_displays.forEach(function (txt) {
            $('<li/>').text(txt).appendTo(cds)
                .on('click', function () {
                    cds.find('li').removeClass('active');
                    $(this).addClass('active');
                    console.warn(txt);
                });
        });
        cds.find('li:first').addClass('active');
    };

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

    var state = {
        me: {
            name: 'amin'
        }
    };

    function init(_symbol, contracts_for) {
        symbol = _symbol;
        g = contracts_for;
        _view = rv.bind(dom.root[0],state)
        dict = clean(contracts_for.available); // clean the data

        console.warn(contracts_for);

        dialog = windows.createBlankWindow($html, {
            title: symbol.display_name,
            resizable: false,
            collapsable: false,
            minimizable: false,
            maximizable: false,
            //height: 500
        });

        dom.contract_category_display = selectmenu(dom.root.find('.contract-category-display'), {
            array: dict.categories,
            change: events.contract_category_display.change
        });

        dom.duration_select = selectmenu(dom.root.find('.duration-select'), {
            array: ['Duration', 'End Time'],
            change: function (val) {
                console.warn(val);
            }
        });
        dom.duration_unit = selectmenu(dom.root.find('.duration-unit'), {
            array: ['ticks','minutes','hours', 'days'],
            change: function (val) {
                console.warn(val);
            }
        });
        dom.duration_count = dom.root.find('.duration-count').spinner({
            min: 0
        });

        //dom.contract_category_display = select.selectmenu({ change: events.contract_category_display.change });
        dom.contract_displays = dom.root.find('.contract-displays');
        events.contract_category_display.change();

        dialog.dialog('open');
    }

    return {
        init: init
    };
});
