/**
 * Created by amin on November 25, 2015.
 */

import _ from 'lodash';
import $ from 'jquery';
import rv from 'rivets';
import moment from 'moment';
import 'jquery-ui';
import 'jquery-sparkline';
import 'ddslick';
import 'chosen';
import 'color-picker'

/* Rivets js does not allow manually observing properties from javascript,
       Use "rv.bind().observe('path.to.object', callback)" to subscribe */
rivets._.View.prototype.observe = function (keypath, callback) {
   let model = this.models, inx = 0;
   while ((inx = keypath.indexOf('.')) !== -1) {
      model = model[keypath.substring(0,inx)];
      keypath = keypath.substring(inx + 1);
   };
   this.adapters['.'].observe(model, keypath,
      () => callback(model[keypath])
   );
};

/************************************* formatters ***************************************/

/* rivets formatter to translate strings to 18n */
rv.formatters['i18n'] = (value) => {
   if(typeof value === 'string') return value.i18n();
   return value;
};
/* rivets formatter to get the property value of an object */
rv.formatters['prop'] = (value, prop) => {
   return value && value[prop];
};
/* rivets formatter to check if a value is one of the given args */
rv.formatters['one-of'] = (...args) => {
   const value = args[0];
   for (let i = 1; i < args.length ; ++i)
      if(args[i] === value)
         return true;
   return false;
}
/* rivets formatter to trim a string */
rv.formatters['trim'] = (value) => _.trim(value);
/* rivets formatter to negate a value */
rv.formatters['negate'] = (value) => !value;
/* rivets formatter to check equallity of two values */
rv.formatters.eq = (value, other) => value === other;
/* formatter to check not-equality of values */
rv.formatters['not-eq'] = (value, other) => value !== other;
/* rivets formatter to replace a falsy value with a default one */
rv.formatters['or'] = (value, other) => value || other;
/* rivets formatter to replace a falsy value with a default one */
rv.formatters['or-not'] = (value, other) => value || !other;
/* rivets formatter to replace a true value with a default one */
rv.formatters['and'] = (vlaue, other) => vlaue && other;
/* rivets formatter and not  */
rv.formatters['and-not'] = (vlaue, other) => vlaue && !other;
/* rivets formatter for > operator  */
rv.formatters['gt'] = (vlaue, other) => vlaue > other;
/* rivets formatter for < operator  */
rv.formatters['lt'] = (vlaue, other) => vlaue < other;
/* localise price format*/
rv.formatters['format-price'] = (value, currency) => (value) ?  formatPrice(value, currency) : undefined;
/* rivets formater to capitalize string */
rv.formatters.capitalize = {
   read: (value) => _.capitalize(value),
   publish: (value) => value.toLowerCase()
};
/* call toFixed on a fload number */
rv.formatters['to-fixed'] = (value, digits) => {
   if(!$.isNumeric(value) || !$.isNumeric(digits)){
      return;
   }
   return (value * 1).toFixed(digits || 2);
}
/* notify other functions on property changes */
rv.formatters['notify'] = (...args) => {
   const value = args[0];
   for (let i = 1; i < args.length ; ++i)
      _.defer(args[i], value);
   return value;
}
/* rv 2-way formatter for checkboxes */
rv.formatters.checkbox = {
   read: (value, first, second) => _.trim(value, " '\"") == first,
   publish: (value, first, second) => _.trim(value ? first: second, " '\""),
}
/* rv formmatter to bind a given function to a value */
rv.formatters['bind'] = (fn, value) => fn.bind(undefined, value);

rv.formatters['map'] = (array, field) => _.map(array, field);
/* rv formatter to prepend a value */
rv.formatters['prepend'] = (value, other) => (other && value) ? other + value : value;
/* rv formatter to append a value */
rv.formatters['append'] = (value, other) => (other && value) ? value + other : value;
/* ternary operator (condition ? first : second) */
rv.formatters['ternary'] = (condition, first, second) => condition ? first : second;
/* formatter to add a currency symbol before the value */
rv.formatters.currency = (value, currency) => {
   const currency_symbols = {
      'USD': '$', /* US Dollar */ 'EUR': '€', /* Euro */ 'CRC': '₡', /* Costa Rican Colón */
      'GBP': '£', /* British Pound Sterling */ 'ILS': '₪', /* Israeli New Sheqel */
      'INR': '₹', /* Indian Rupee */ 'JPY': '¥', /* Japanese Yen */
      'KRW': '₩', /* South Korean Won */ 'NGN': '₦', /* Nigerian Naira */
      'PHP': '₱', /* Philippine Peso */ 'PLN': 'zł', /* Polish Zloty */
      'PYG': '₲', /* Paraguayan Guarani */ 'THB': '฿', /* Thai Baht */
      'UAH': '₴', /* Ukrainian Hryvnia */ 'VND': '₫', /* Vietnamese Dong */
   };
   if(value)
      return (currency_symbols[currency] || currency) + value;
   return value;
}
/* formatter to convert epoch to utc-time in hh:mm:ss format */
rv.formatters['utc-time'] = (epoch) => {
   const d = new Date(epoch * 1000); /* since unixEpoch is simply epoch / 1000, we  multiply the argument by 1000 */
   return ("00" + d.getUTCHours()).slice(-2) + ":" +
      ("00" + d.getUTCMinutes()).slice(-2) + ":" +
      ("00" + d.getUTCSeconds()).slice(-2);
}
rv.formatters['moment'] = (epoch, format) => {
   format = format || 'YYYY-MM-DD HH:mm:ss';
   return epoch && moment.utc(epoch*1000).format(format);
}
/* human readable difference of two epoch values */
rv.formatters['moment-humanize'] = (from_epoch, till_epoch) => {
   if(!from_epoch || !till_epoch) {
      return undefined;
   }

   let ret = '';
   const seconds = till_epoch - from_epoch;
   const duration = moment.duration(seconds, 'seconds');
   if (duration.days() > 0)
      ret += ' ' + duration.days() + ' ' + (duration.days() > 1 ? 'days' : 'day');
   if (duration.hours() > 0)
      ret += ' ' + duration.hours() + ' ' + (duration.hours() > 1 ? 'hours' : 'hour');
   if (duration.minutes() > 0)
      ret += ' ' + duration.minutes() + ' ' + (duration.minutes() > 1 ? 'minutes' : 'minute');
   if (duration.seconds() > 0 && seconds < 10*60)
      ret += ' ' + duration.seconds() + ' ' + (duration.seconds() > 1 ? 'seconds' : 'second');

   return _.trim(ret).i18n();
}
/* formatter to bold last character */
rv.formatters['bold-last-character'] = (str) => {
   str = str + '';
   return str.substring(0, str.length - 1) + '<strong>' + _.last(str) + '</strong>';
}
/* formatter to calcualte the percent of a value of another value */
rv.formatters['percent-of'] = (changed, original) => {
   if(changed === undefined || !original)
      return undefined;
   return (100*(changed - original)/original).toFixed(2)+'%';
}

rv.formatters['is-valid-email'] = (email) => email === '' || validateEmail(email);
rv.formatters['is-valid-date'] = (date, format =  'YYYY-MM-DD') => moment(date, format, true).isValid();
rv.formatters['is-valid-regex'] = (str, regex) => new RegExp(regex).test(str);
rv.formatters.length = (value) => value.length;

/* Debouncing enforces that a function not be called again until a certain amount of time has passed without it being called.
       As in "execute this function only if 100 milliseconds have passed without it being called." */
rv.formatters.debounce = (value, callback, timeout = 250) => {
   clearTimeout(callback._timer_notify);
   callback._timer_notify = setTimeout(callback.bind(undefined,value), timeout);
   return value;
}

/*************************************  binding *****************************************/
rv.binders.ddslick = {
   priority: 101,
   publishes: true,
   bind: function (el) {
      const publish = this.publish,
         model = this.model,
         select = $(el);
      const parent = select.parent();
      const values = select.find('option').map((inx, opt) => $(opt).val()).get();

      const update = (value) => {
         const inx = values.indexOf(value);

         parent.find('.dd-select input').val(value);
         const selected_img = parent.find('img.dd-selected-image');
         const img = parent.find('img')[inx+1];

         selected_img.attr('src', $(img).attr('src'));
      }

      el._update = update;

      let model_value = model.value;
      select.ddslick({
         imagePosition: "left",
         data: [],
         // width: 155,
         background: "white",
         onSelected: (data) => {
            let value = data.selectedData.value
            value = model_value || value;
            model_value = null;
            model.value = value;
            update(value);
         }
      });
   },
   unbind: (el) => $(el).ddslick('destroy'),
   routine: (el, value) => el._update(value)
};

/* turn current select item into a jquery-ui-selectmenu, update value on change */
rv.binders.selectmenu = {
   priority: 100,
   publishes: true,
   bind: function (el) {
      const publish = this.publish,
         select = $(el);
      select.selectmenu({
         change: () => {
            publish(select.val());
            select.trigger('change');
         }
      });
   },
   unbind: (el) => $(el).selectmenu( "destroy" ),
   routine: (el, value) => {
      el = $(el);
      el.val(value);
      if(el.find("option[value='" + value + "']").length > 0)
         el.selectmenu('refresh');
   }
};

rv.binders['is-valid-number'] = {
   priority: 100,
   publishes: true,
   bind: function (el) {
      const prop = this.keypath.split('.')[1];
      const model = this.model;
      const $input = $(el);
      const reg = /^(?!0\d)\d*(\.\d{1,4})?$/;

      $input.on('input', () => {
         const val = $input.val();
         const is_ok = reg.test(val);

         model[prop] = is_ok && val !== '';
      });
   },
   unbind: (el) => { },
   routine: (el, value) => { }
};

/* bindar for jqueyr ui selectmenu options */
rv.binders['selectmenu-*'] = function (el, value) {
   $(el).selectmenu('option', this.args[0], value);
}
/*binder for hidding overflow on selctmenu*/
rv.binders['selectmenu-css-*'] = function(el,value) {
   $(el).selectmenu("menuWidget").css(this.args[0], value);
}

/* refersh the selectmenu on array changes */
rv.binders.selectrefresh = {
   priority: 99,
   routine: (el,array_or_value) => {
      el = $(el);
      if(typeof array_or_value === 'string') {
         el.val(array_or_value);
         if(el.find("option[value='" + array_or_value+ "']").length === 0)
            return;
      }
      el.selectmenu('refresh');
   }
}

/* Multiselect select menu "chosen"*/
rv.binders.chosen = {
   priority: 100,
   publishes: true,
   bind: function(el){
      const publish = this.publish;
      $(el).chosen({width:$(el).css("width")}).change(function() {
         publish($(this).val())
      });
   },
   unbind: (el) => $(el).chosen("destroy")
}

/* binder for chosen refresh */
rv.binders.chosenrefresh = (el) => $(el).trigger("chosen:updated");

/* extend jquery ui spinner to support multiple buttons */
$.widget('ui.webtrader_spinner', $.ui.spinner, {
   _buttonHtml: function () {
      const btn = (dir, icon, step, radius, right) => {
         icon = 'ui-icon-' + icon + '-1-' + (dir === 'up' ? 'n' : 's');
         right = 'right: ' + (right || '0px') + ';';
         radius = radius || '5px';
         radius = 'border-radius: 0 ' + (dir == 'up' ? radius + ' 0' : '0 ' + radius) + ' 0';

         return "<button step='" + step + "' class='ui-spinner-button ui-spinner-" + dir +
            "' style='" + right + radius + "'>" +
            "<span class='ui-icon " + icon +"'>&#9650;</span>" +
            "</button>";
      }

      let ret = '';
      ret += btn('up', 'triangle', this.options.step_big || this.options.step, '5px');
      ret += btn('down', 'triangle', '-' +(this.options.step_big || this.options.step), '5px');
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
      const model = this.model;
      const publish = this.publish;
      const input = $(el);
      input.webtrader_spinner({
         stop: () => {
            const value = input.val();
            publish(value * 1);
         },
         spin: function (e,ui) {
            const step = $(e.currentTarget).attr('step') + '';
            const decimals = (step.split('.')[1] || []).length;
            value = $(this).val()*1 + step*1;
            $(this).val(value.toFixed(decimals));
            e.preventDefault();
         },
         step: input.attr('step') || 1,
         step_big: input.attr('step-big') || null
      });
   },
   unbind: (el) => $(el).webtrader_spinner('destroy'),
   routine: (el,value) => $(el).webtrader_spinner('value', value*1)
};

/* bind values to jquery ui spinner options like 'min', 'max', ... */
rv.binders['spinner-*'] = function(el,value) {
   $(el).webtrader_spinner('option', this.args[0], value);
}

/* bindar for jqueyr ui dialog options */
rv.binders['dialog-*'] = function (el, value) {
   $(el).dialog('option', this.args[0], value);
}
rv.binders['color-picker'] = {
   priority: 96,
   publishes: true,
   bind: function (el) {
      const input = $(el);

      const publish = this.publish;
      const model = this.model;
      const color = model.value || '#cd0a0a';

      const altField = $('<div style="width:100%;"/>');
      input.after(altField);

      input.colorpicker({
         showOn: 'alt',
         altField: altField,
         position: {
            my: "left-100 bottom+5",
            of: "element",
            collision: "fit"
         },
         parts:  [ 'map', 'bar' ],
         alpha:  true,
         layout: {
            map: [0, 0, 2, 2],
            bar: [2, 0, 1, 2],
         },
         colorFormat: "RGBA",
         part: { map: {size: 128}, bar: {size: 128} },
         select: (event, color) => publish(color)
      });

      setTimeout(() => {
         parent = input.scrollParent();
         parent.scroll(
            () => input.colorpicker('close')
         );
      }, 1000);
   },
   unbind: (el) => { },
   routine: (el, value) => { }
}

rv.binders.slider = {
   priority: 95,
   publishes: true,
   bind: function (el) {
      const div = $(el);
      const handle = $('<div class="ui-slider-handle"></div>');
      div.append(handle);

      const publish = this.publish;
      const model = this.model;

      div.slider({
         step: div.attr('step')*1 || 1,
         min: div.attr('min') === undefined ? 1 : div.attr('min')*1,
         max: div.attr('max')*1 || 100,
         create: function() {
            handle.text($(this).slider("value"));
         },
         slide: ( event, ui ) => {
            handle.text(ui.value);
            model.value = ui.value*1;
         }
      });
   },
   unbind: (el) => $(el).slider('destroy'),
   routine: (el, value) => {
      $(el).slider('value', value);
      $(el).find('> div').text(value);
   }
}

/* trun input element in jquery-ui-datepicker */
rv.binders.datepicker = {
   priority: 94,
   publishes: true,
   bind: function (el) {
      const input = $(el);
      const publish = this.publish;
      const model = this.model;
      const styles = { marginTop: input.attr('marginTop') || '0px', marginLeft: input.attr('marginLeft') || '0px' };

      const options = {
         showOn: model.showOn || 'focus',
         numberOfMonths: input.attr('numberOfMonths')*1 || 2,
         dateFormat: model.dateFormat || 'yy-mm-dd',
         showAnim: model.showAnim ||  'drop',
         showButtonPanel: model.showButtonPanel !== undefined ? model.showButtonPanel : true,
         changeMonth: model.changeMonth || true,
         changeYear: model.changeYear || true,
         onSelect: function () { $(this).change(); },
         beforeShow: (input, inst) => inst.dpDiv.css(styles),
         closeText: 'Done'.i18n(),
         currentText: 'Today'.i18n()
      };
      if(model.yearRange)
         options.yearRange = model.yearRange;
      else {
         options.maxDate = model.maxDate || null;
         options.minDate = model.minDate || 0;
      }

      const dpicker = input.datepicker(options);
      input.on('change', () => {
         const value = input.val();
         publish(value);
         input.blur(); // remove focus from input
      });

      $.datepicker._gotoToday = (id) => {
         $(id).datepicker('setDate', new Date()).change().datepicker('hide');
      };
   },
   unbind: (el) => $(el).datepicker('destroy'),
   /* value could be Date() object or a string in yyyy-mm-dd format */
   routine: (el, value) => $(el).datepicker("setDate", value)
}

/* truen input element in to jquery-ui-timepicker */
rv.binders.timepicker = {
   priority: 93,
   publishes: true,
   bind: function (el) {
      const input = $(el);
      const publish = this.publish;
      const model = this.model;
      const allways_ok = () => true;

      const styles = { marginTop: input.attr('marginTop') || '0px', marginLeft: input.attr('marginLeft') || '0px' };
      input.on('change', () => {
         publish(input.val());
         input.blur();
      });

      input.timepicker({
         showPeriod: model.showPeriod || false,
         showLeadingZero: model.showLeadingZero || true,
         showCloseButton: model.showCloseButton || true,
         showNowButton: model.showNowButton || false,
         onHourShow: model.onHourShow || allways_ok,
         onMinuteShow: model.onMinuteShow || allways_ok,
         beforeShow: (input, inst) => inst.tpDiv.css(styles),
         onSelect: function(){ $(this).change() },
         hourText: 'Hour'.i18n(),
         minuteText: 'Minute'.i18n(),
         amPmText: ['AM'.i18n(), 'PM'.i18n()],
         closeButtonText: 'Done'.i18n(),
         nowButtonText: 'Now'.i18n(),
         deselectButtonText: 'Deselect'.i18n()
      });
   },
   unbind: (el) => $(el).timepicker('destroy'),
   routine: (el, value) => $(el).val(value)
}

/* add a css class to corresponding jquery-ui widget from the dummy html element */
rv.binders['jq-class'] = {
   priority: 92,
   routine: (el, value) => {
      el = $(el);
      const menu = $('#' + el.attr('id') + '-menu'); // get the id of widget
      menu.removeClass(el.data('jq-class'));
      el.data({ 'jq-class': value });
      menu.addClass(value);
   }
}

/* rv binder to active click event on another button when Enter key is pressed */
rv.binders['input-default-btn'] = (el, jquery_selector) => {
   $(el).keyup((event) => {
      if(event.keyCode == 13) {
         $(jquery_selector).click();
      }
   });
}

/* bindar for css attributes */
rv.binders['css-*'] = function (el, value) {
   const style = {};
   style[this.args[0]] = value;
   $(el).css(style);
}

$.fn.getHiddenOffsetWidth = function () {
   // save a reference to a cloned element that can be measured
   const $hiddenElement = $(this).clone().appendTo('body');
   // calculate the width of the clone
   const width = $hiddenElement.outerWidth();
   // remove the clone from the DOM
   $hiddenElement.remove();
   return width;
};
/* scale the font-size to fit the text on the given width*/
rv.binders['scale-font-size'] = (el, value) => {
   let cur_font = 14;
   const $el = $(el);
   do {
      el.style.fontSize = cur_font + 'px';
      cur_font -= 1;
   } while($el.getHiddenOffsetWidth() > value*1)
}

rv.binders['show'] = (el, value) => {
   el.style.display = value ? '' : 'none';
   return value;
};
rv.binders['visible'] = (el, value) => {
   el.style.visibility = value ? 'visible' : 'hidden';
   return value;
};
/* binder to add or remove disabled attribute */
rv.binders.disabled = (el,value) => {
   if(value) $(el).attr('disabled', 'disabled');
   else $(el).removeAttr('disabled');
}

/* binder to scroll to buttom automatically */
rv.binders['auto-scroll-bottom'] = {
   priority: 91, /* run after native bindings */
   routine: (el) => {
      $(el).animate({ scrollTop: el.scrollHeight - $(el).height() }, 'slow');
   }
}

/* http://stackoverflow.com/questions/10454518 */
const decimalPlaces = (num) => {
   const match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
   let ret = 0;
   if (match) {
      ret = Math.max( 0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
   }
   return ret;
}
/* rviets formatter for decimal round */
rv.binders['decimal-round'] = {
   priority: 3001,
   routine: (input, places) => {
      const mul = {'0': 1, '1': 10, '2': 100, '3': 1000, '4': 10000, '5': 100000}[places];
      input = $(input);
      input.on('input', () => {
         const prefered_sign = input.attr('prefered-sign') || '';
         const no_symbol = input.attr('no-symbol');
         let val = input.val();
         if(val === '') return;
         if(val === '-' || val === '+' && !no_symbol) return;
         const dps = decimalPlaces(val);
         if(dps && dps <= places ) return;
         const dot = val.endsWith('.') ? '.' : '';
         let symbol = val[0];
         symbol = (symbol === '+' || symbol === '-') ? symbol : '';
         val = val.replace(/[^\d.-]/g,'');
         val = (Math.round(val * mul) / mul);
         val = Math.abs(val);
         if(!isNaN(val)) {
            if(prefered_sign && symbol === '') symbol = prefered_sign;
            if(no_symbol) symbol = '';
            input.val(symbol + val + dot);
         }
      })

   }
}

/* binder with high priority to apply attributes first */
rv.binders['attr-*'] = {
   priority: 10*1000,
   routine: function(el,value) {
      el.setAttribute(this.args[0],value)
   }
}

/* ticks: [ {quote: ''} ] */
rv.binders['sparkline'] = (el, spots) => {
   const chart = $(el);
   const config = {
      type: 'line',
      lineColor: '#606060',
      fillColor: false,
      spotColor: '#00f000',
      minSpotColor: '#f00000',
      maxSpotColor: '#0000f0',
      highlightSpotColor: '#ffff00',
      highlightLineColor: '#000000',
      spotRadius: 1.25
   };
   setTimeout(() => {
      chart.sparkline(spots, config);
      spots.length ? chart.show() : chart.hide();
   }, 0);
}

/* rv binder for indicative color change logic */
rv.binders['indicative-color'] = (el, value) => {
   const perv = (el._perv_indicative_color || 0)*1;
   const red = '#d71818';
   const green = '#02920e';
   const black = 'black';
   if(!$.isNumeric(value)) {
      $(el).css({color: black});
   }
   else if(perv !== value*1) {
      $(el).css({color: perv < value*1 ? green : red});
   }
   el._perv_indicative_color = value;
}

/******************************** components *****************************/
const component_twoway_bind = (self, data, keypathes) => {
   /* make sure to call async */
   setTimeout(() => {
      for(let i = 0; i < keypathes.length; ++i){
         const keypath = keypathes[i];
         const key = _.last(keypath.split('.'));
         const observer = self.observers[key];
         if(observer) {
            observer.options.adapters['.'].observe(observer.target, _.last(observer.keypath.split('.')), () => {
               const updated = observer.target[_.last(observer.keypath.split('.'))];
               data.value = updated;
            });
            self.componentView.observe(keypath, (value) => observer.setValue(value));
         }
      }
   }, 0);
}
rivets.components['price-spinner'] = {
   static: ['class', 'min', 'decimals'],
   template:
   () => `<span class="ui-spinner ui-widget ui-widget-content ui-corner-all">
               <input rv-class="data.class" type="text" rv-value="data.value" rv-decimal-round="data.decimals | or 5" no-symbol="no-symbol" />
                 <button rv-on-click="increment" step="1" class="ui-spinner-button ui-spinner-up ui-button ui-widget ui-state-default ui-button-text-only" style="right: 0px;border-radius: 0 5px 0 0" tabindex="-1" role="button">
                   <span class="ui-button-text"> <span class="ui-icon ui-icon-triangle-1-n">▲</span> </span>
                 </button>
                 <button rv-on-click="decrement" step="-1" class="ui-spinner-button ui-spinner-down ui-button ui-widget ui-state-default ui-button-text-only" style="right: 0px;border-radius: 0 0 5px 0" tabindex="-1" role="button">
                   <span class="ui-button-text"> <span class="ui-icon ui-icon-triangle-1-s">▼</span> </span>
                 </button>
             </span>`,
   initialize: function(el, data) {
      const decimals = (data.decimals || 2)*1;
      const min = (data.min || 0)*1;
      component_twoway_bind(this, data, ['data.value']);

      return {
         data: data,
         increment: (e,scope) => {
            let value = data.value*1;
            value = value < 1 ? value + 0.1 : value + 1;
            if((value | 0) !== value) {
               value = value.toFixed(decimals);
            }
            data.value = value;
         },
         decrement: () => {
            let value = data.value*1;
            value = value > 1 ? value - 1 : value - 0.1;
            if((value | 0) !== value) { /* is float */
               value = value.toFixed(decimals);
            }
            if(value > min) {
               data.value = value;
            }
         }
      };
   },
};

export const bind = (view, state) => rv.bind(view, state);
export const formatters = rv.formatters;
export const binders = rv.binders;

export default {
   bind,
   formatters,
   binders
};
