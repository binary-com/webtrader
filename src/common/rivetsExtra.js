/**
 * Created by amin on November 25, 2015.
 */

define(['jquery', 'rivets', 'jquery-ui'], function ($, rv) {

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

    /************************************* formatters ***************************************/
    /* rivets formatter to check equallity of two values */
    rv.formatters.eq = function (value, other) {
        return value === other;
    };
    /* formatter to check not-equality of values */
    rv.formatters['not-eq'] = function (value, other) {
        return value !== other;
    };
    /* rivets formatter to replace a falsy value with a default one */
    rv.formatters['or'] = function (value, other) {
        return value || other;
    };
    /* rivets formater to capitalize string */
    rv.formatters.capitalize = {
        read: function (value) {
            return value.charAt(0).toUpperCase() + value.slice(1);
        },
        publish: function (value) {
            return value.toLowerCase();
        }
    };
    /* call toFixed on a fload number */
    rv.formatters['to-fixed'] = function (value, digits) {
        digits = digits || 2;
        return (value * 1).toFixed(digits);
    }
    /* rviets formatter to parse json values */
    rv.formatters['json-parse'] = function (value) {
        return JSON.parse(value);
    }
    /* notify another function on property changes */
    rv.formatters['notify'] = function() {
        var args = [].slice.call(arguments, 0);
        var value = args[0];
        for (var i = 1; i < args.length ; ++i)
            setTimeout(args[i].bind(this, value), 0);
        return value;
    }
    /* prepend fomatter will use + perator to prepend (usallay a string) value */
    rv.formatters.prepend = function(value, other){
      return other + value;
    }
    /* formatter to add a currency symbol before the value */
    rv.formatters.currency = function(value, currency){
      var currency_symbols = {
        'USD': '$', /* US Dollar */ 'EUR': '€', /* Euro */ 'CRC': '₡', /* Costa Rican Colón */
        'GBP': '£', /* British Pound Sterling */ 'ILS': '₪', /* Israeli New Sheqel */
        'INR': '₹', /* Indian Rupee */ 'JPY': '¥', /* Japanese Yen */
        'KRW': '₩', /* South Korean Won */ 'NGN': '₦', /* Nigerian Naira */
        'PHP': '₱', /* Philippine Peso */ 'PLN': 'zł', /* Polish Zloty */
        'PYG': '₲', /* Paraguayan Guarani */ 'THB': '฿', /* Thai Baht */
        'UAH': '₴', /* Ukrainian Hryvnia */ 'VND': '₫', /* Vietnamese Dong */
      };
      return (currency_symbols[currency] || currency) + value;
    }

    /* Debouncing enforces that a function not be called again until a certain amount of time has passed without it being called.
       As in "execute this function only if 100 milliseconds have passed without it being called." */
    rv.formatters.debounce = function(value, callback, timeout) {
        timeout = timeout || 250;
        clearTimeout(callback._timer_notify);
        callback._timer_notify = setTimeout(callback.bind(this,value), timeout);
        return value;
    }

    /*************************************  binding *****************************************/
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
                    console.warn('selectmenu.change()', select.val());
                    publish(select.val());
                    select.trigger('change');
                }
            });
        },
        unbind: function(el){
            $(el).selectmenu( "destroy" )
        },
        routine: function (el, value) {
            console.warn('selectmenu.routine()', value);
            $(el).val(value).selectmenu('refresh');
        }
    };

    /* refersh the selectmenu on array changes */
    rv.binders.selectrefresh = {
        priority: 99,
        routine: function(el,array) {
            $(el).selectmenu('refresh');
        }
    }

    /* extend jquery ui spinner to support multiple buttons */
    $.widget('ui.webtrader_spinner', $.ui.spinner, {
        _buttonHtml: function () {
            var btn = function(dir, icon, step, radius, right){
                icon = 'ui-icon-' + icon + '-1-' + (dir === 'up' ? 'n' : 's');
                right = 'right: ' + (right || '0px') + ';';
                radius = radius || '5px';
                radius = 'border-radius: 0 ' + (dir == 'up' ? radius + ' 0' : '0 ' + radius) + ' 0';

                return "<button step='" + step + "' class='ui-spinner-button ui-spinner-" + dir +
                        "' style='" + right + radius + "'>" +
                          "<span class='ui-icon " + icon +"'>&#9650;</span>" +
                       "</button>";
            }

            var ret = '';
            if (this.options.step_big)
                ret += btn('up', 'arrowthick', this.options.step_big, '5px', '15px');

            ret += btn('up', 'triangle', this.options.step, '5px');

            if (this.options.step_big)
                ret += btn('down', 'arrowthick', '-' + this.options.step_big, '5px', '17px');

            ret += btn('down', 'triangle', '-' + this.options.step, '5px');
            return ret;
        }
    });
    /* turn input element into jquery-ui-spinner, model = {min:, max, value:},
        the element can have attributes like 'step' and in additoin an new attribute named 'step-big'.
        the value of these attrebutes will be used to increment/decrement on button press.  */
    rv.binders.spinner = {
        priority: 98,
        publishes: true,
        bind: function (el) {
            console.warn('spinner.bind()');
            var model = this.model;
            var publish = this.publish;
            var input = $(el);
            input.webtrader_spinner({
                stop: function () {
                    var value = input.val();
                    publish(value * 1);
                    console.warn('spinner.stop()', value);
                },
                spin: function (e,ui) {
                    var step = $(e.currentTarget).attr('step') + '';
                    var decimals = (step.split('.')[1] || []).length;
                    value = $(this).val()*1 + step*1;
                    $(this).val(value.toFixed(decimals));
                    e.preventDefault();
                },
                step: input.attr('step') || 1,
                step_big: input.attr('step-big') || null
            });
            input.webtrader_spinner('value', model.value || model.min || 1);
        },
        unbind: function (el) {
            $(el).spinner('destroy');
        },
        routine: function(el,value){
            console.warn('spinner.routing()', (value * 1) || 0);
            $(el).webtrader_spinner('value', value * 1);
        }
    };

    /* bind values to jquery ui spinner options like 'min', 'max', ... */
    rv.binders['spinner-*'] = function(el,value) {
        $(el).webtrader_spinner('option', this.args[0], value);
    }

    /* binder for jquery ui tooltip */
    rv.binders.tooltip = {
        priority: 97,
        bind: function (el) {
            console.warn('binders.tooltip.bind()');
            $(el).attr('title',' ');
            $(el).tooltip();
        },
        unbind: function (el) {
            console.warn('binders.tooltip.unbind()');
            $(el).tooltip('destory');
        },
        routine: function (el, value) {
            console.warn('binders.tooltip.routing()', value);
            $(el).tooltip('option', 'content', value);
        }
    }
    /* bindar for jqueyr ui tooltip options */
    rv.binders['tooltip-*'] = function (el, value) {
        console.warn('binders.tooltip-*.routine()', this.args[0], value);
        $(el).tooltip('option', this.args[0], value);
    }

    /* trun input element in jquery-ui-datepicker */
    rv.binders.datepicker = {
        priority: 94,
        publishes: true,
        bind: function (el) {
            console.warn('datepicker.bind()');
            var input = $(el);
            var publish = this.publish;
            var model = this.model;
            var styles = { marginTop: input.attr('marginTop') || '0px', marginLeft: input.attr('marginLeft') || '0px' };
            console.warn('datepicker.bind() styles=', styles);

            var options = {
                showOn: model.showOn || 'focus',
                numberOfMonths: input.attr('numberOfMonths')*1 || 2,
                maxDate: model.maxDate || 0,
                minDate: model.minDate || new Date(2010, 0, 1),
                dateFormat: model.dateFormat || 'yy-mm-dd',
                showAnim: model.showAnim ||  'drop',
                showButtonPanel: model.showButtonPanel || true,
                changeMonth: model.changeMonth || true,
                changeYear: model.changeYear || true,
                onSelect: function () { $(this).change(); },
                beforeShow: function (input, inst) { inst.dpDiv.css(styles); },
                dateFormat: "yy-mm-dd"
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
        /* value could be Date() object or a string in yyyy-mm-dd format */
        routine: function (el, value) {
            $(el).datepicker("setDate", value);
        }
    }

    /* truen input element in to jquery-ui-timepicker */
    rv.binders.timepicker = {
        priority: 93,
        publishes: true,
        bind: function (el) {
            var input = $(el);
            var publish = this.publish;
            var model = this.model;
            var allways_ok = function () { return true };

            var styles = { marginTop: input.attr('marginTop') || '0px', marginLeft: input.attr('marginLeft') || '0px' };
            var update = function () {
                var value = input.val();
                console.warn('timepicker changed >', value);
                publish(value);
            };

            input.timepicker({
                showPeriod: model.showPeriod || false,
                showLeadingZero: model.showLeadingZero || true,
                showCloseButton: model.showCloseButton || true,
                showNowButton: model.showNowButton || true,
                onHourShow: model.onHourShow || allways_ok,
                onMinuteShow: model.onMinuteShow || allways_ok,
                beforeShow: function (input, inst) {
                    inst.tpDiv.css(styles);
                },
                onClose: update
            });
        },
        unbind: function (el) {
            $(el).timepicker('destroy');
        },
        routine: function (el, value) {
            $(el).val(value);
        }
    }

    /* add a css class to corresponding jquery-ui widget from the dummy html element */
    rv.binders['jq-class'] = {
        priority: 92,
        routine: function (el, value) {
            console.warn('rv.binders.jq-class.routine()', value);
            el = $(el);
            var menu = $('#' + el.attr('id') + '-menu'); // get the id of widget
            menu.removeClass(el.data('jq-class'));
            el.data({ 'jq-class': value });
            menu.addClass(value);
        }
    }


    /* override rv-show to use jQuery fadeIn/FadeOut instead */
    rv.binders['show'] = function(el, value) {
        value ? $(el).fadeIn() : $(el).fadeOut();
        return value ? '' : 'none';
    };

    return rv;
});
