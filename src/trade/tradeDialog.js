/**
 * Created by amin on November 18, 2015.
 */

define(['jquery', 'windows/windows', 'rivets', 'text!trade/tradeDialog.html', 'css!trade/tradeDialog.css', 'timepicker', 'jquery-ui'], function ($, windows, rv, $html) {

    var root = $($html);

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

    /* Rivets js does not allow manually observing properties from javascript,
       Use "rv.bind().observe('path.to.object', callback)" to subscribe */
    rivets._.View.prototype.observe = function (keypath, callback) {
        var model = this.models,
            inx;
        while ((inx = keypath.indexOf('.')) !== -1) {
            model = model[keypath.substring(0,inx)];
            keypath = keypath.substring(inx + 1);
            console.warn(JSON.stringify(model), keypath);
        };
        this.adapters['.'].observe(model, keypath, function () {
            callback(model[keypath]);
        });
    };
    /* rivets formatter to check equallity of two values */
    rv.formatters.eq = function (value, other) {
        console.warn('eq >', value, other);
        return value === other;
    }
    /* turn current select item into a jquery-ui-selectmenu, update value on change */
    rv.binders.selectmenu = {
        priority: 100,
        publishes: true,
        bind: function (el) {
            console.warn('selectmenu.bind()');
            var publish = this.publish,
                select = $(el);
            select.selectmenu({
                change: function () {
                    publish(select.val());
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
    /* turn input element into jquery-ui-spinner, model = {min:, max, value:} */
    rv.binders.spinner = {
        priority: 98,
        publishes: true,
        bind: function (el) {
            console.warn('spinner.bind()');
            var model = this.model;
            var publish = this.publish;
            var input = $(el);
            var onchange = function () {
                var value = input.val();
                publish(value | 0);
            }
            input.spinner({
                min: model.min || 1,
                max: model.max || null,
                stop: onchange
            });
        },
        unbind: function (el) {
            $(el).spinner('destroy');
        },
        routine: function(el,value){
            console.warn('spinner.routing()', value);
            $(el).spinner('value', value);
        }
    };
    /* trun input element in jquery-ui-datepicker */
    rv.binders.datepicker = {
        priority: 97,
        publishes: true,
        bind: function (el) {
            console.warn('datepicker.bind()');
            var input = $(el);
            var publish = this.publish;
            var model = this.model;
            var styles = (model && model.styles) || { marginTop: '10px', marginLeft: '-220px' }; 

            var options = {
                showOn: model.showOn || 'focus',
                numberOfMonths: model.numberOfMonths || 2,
                maxDate: model.maxDate || 0,
                minDate: model.minDate || new Date(2010, 0, 1),
                dateFormat: model.dateFormat || 'yy-mm-dd',
                showAnim: model.showAnim ||  'drop',
                showButtonPanel: model.showButtonPanel || true,
                changeMonth: model.changeMonth || true,
                changeYear: model.changeYear || true,
                onSelect: function () { $(this).change(); },
                beforeShow: function (input, inst) { inst.dpDiv.css(styles); }
            };

            var dpicker = input.datepicker(options);
            input.on('change', function () {
                var value = input.val();
                console.warn('datepicker change > ', value);
                publish(value);
                input.blur(); // remove focus from input
            });

            $.datepicker._gotoToday = function (id) {
                $(id).datepicker('setDate', new Date()).change().datepicker('hide');
            };
        },
        unbind: function(el){
            $(el).datepicker('destroy');
        },
        routine: function (el, value) {
            $(el).datepicker("setDate", value);
        }
    }
    /* truen input element in to jquery-ui-timepicker */
    rv.binders.timepicker = {
        priority: 96,
        publishes: true,
        bind: function (el) {
            var input = $(el);
            var publish = this.publish;
            var model = this.model;
            var allways_ok = function () { return true };

            input.timepicker({
                showPeriod: model.showPeriod || false,
                showLeadingZero: model.showLeadingZero || true,
                showCloseButton: model.showCloseButton || true,
                showNowButton: model.showNowButton || true,
                onHourShow: model.onHourShow || allways_ok,
                onMinuteShow: model.onMinuteShow || allways_ok,
                onSelect: function () {
                    var value = input.val();
                    console.warn('timepicker changed >', value);
                    publish(value);
                }
            });
        },
        unbind: function (el) {
            $(el).timepicker('destroy');
        },
        routine: function (el, value) {
            $(el).val(value);
        }
    }

    function init(_symbol, contracts_for) {
        symbol = _symbol;
        dict = clean(contracts_for.available); // clean the data

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
        state.categories.value = state.categories.array[0];

        window._view = rv.bind(root[0],state)
        state.categories.onchange(); // trigger to init categories_display submenu

        dialog.dialog('open');
    }

    return {
        init: init
    };
});
