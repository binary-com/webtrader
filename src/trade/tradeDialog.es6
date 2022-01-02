import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import { SUPPORTED_CONTRACT_TYPES } from 'common/common';
import liveapi from 'websockets/binary_websockets';
import chartingRequestMap from 'charts/chartingRequestMap';
import html from 'text!trade/tradeDialog.html';
import 'css!trade/tradeDialog.css';
import 'timepicker';
import 'jquery-ui';
import 'common/util';
import Lookback from './lookback';

require(['trade/tradeConf']); /* trigger async loading of trade Confirmation */
var replacer = function (field_name, value) { return function (obj) { obj[field_name] = value; return obj; }; };
var debounce = rv.formatters.debounce;

function apply_fixes(available){
    /* fix for server side api, not seperating higher/lower from rise/fall in up/down category */
    _(available).filter({
      'contract_category': 'callput',
      'barrier_category' : 'euro_atm',
      'barriers': 0,
      'sentiment': 'up'
    }).each(replacer('contract_display', 'rise'));

    _(available).filter({
      'contract_category': 'callput',
      'barrier_category': 'euro_atm',
      'barriers': 0,
      'sentiment': 'down'
    }).each(replacer('contract_display','fall'));
    /* fix for server side api, returning two different contract_category_displays for In/Out */
    _(available).filter(['contract_category', 'endsinout']).each(replacer('contract_category_display', 'In/Out'));
    _(available).filter(['contract_category', 'staysinout']).each(replacer('contract_category_display', 'In/Out'));
    /* fix for websocket having a useless barrier value for digits */
    _(available).filter(['contract_category', 'digits']).each(replacer('barriers', 0));
    /* fix for contract_display text in In/Out menue */
    _(available).filter({"contract_type": "EXPIRYMISS"}).each(replacer('contract_display', 'ends outside'));
    _(available).filter({"contract_type": "EXPIRYRANGE"}).each(replacer('contract_display', 'ends between'));
    _(available).filter({"contract_type": "RANGE"}).each(replacer('contract_display', 'stays between'));
    _(available).filter({"contract_type": "UPORDOWN"}).each(replacer('contract_display', 'goes outside'));
    _(available).filter({"contract_type": "ONETOUCH"}).each(replacer('contract_display', 'touch'));
    _(available).filter({"contract_type": "NOTOUCH"}).each(replacer('contract_display', 'no touch'));

    /* sort the items in the array according to the way we want to show them */
    available = _.sortBy(available,function(row){
      var rank = _.find({ 'Up/Down': 1, 'Touch/No Touch':2, 'In/Out': 3, 'Digits': 4, 'Asians': 5, 'Spreads': 6 },
        (val, key) => {
          if(key.i18n() == row.contract_category_display || key == row.contract_category_display){
            return val;
          }
        }
      );
      if(rank === 4) { /* Digits */
        rank = {'odd': 4, 'even' : 4.5}[row.contract_display] || 3.5;
      }
      return rank
    });

    return available;
}

/* get open and close time for a symbol trading_times */
function trading_times_for(yyyy_mm_dd, symbol) {
    return liveapi.cached
           .send({trading_times: yyyy_mm_dd})
           .then(function(data){
              var times = { open : '--', close: '--'};
              data.trading_times.markets.forEach(function(market){
                  market.submarkets.forEach(function(sub){
                    sub.symbols.forEach(function(sym){
                      if(sym.symbol === symbol) {
                        times = {open: sym.times.open[0], close: sym.times.close[0]};
                      }
                    });
                  });
              });
              return times;
           })
           .catch(function(err){
             console.error(err);
             return { open : '--', close: '--'};
           });
}

/* return the current state of dialog as a template */
function get_current_template(state) {
  return {
    name: state.template.name,
    categories_value: state.categories.value,
    categoriy_displays_selected: state.category_displays.selected,
    date_start_value: state.date_start.value,
    digits_value: state.digits.value,
    duration_value: state.duration.value,
    duration_count_value: state.duration_count.value,
    duration_unit_value: state.duration_unit.value,
    expiry_value_hour: state.date_expiry.value_hour,
    expiry_value_date: state.date_expiry.value_date,
    expiry_value: state.date_expiry.value,
    barriers_barrier_count: state.barriers.barrier_count,
    barriers_barrier: state.barriers.barrier,
    barriers_high_barrier: state.barriers.high_barrier,
    barriers_low_barrier: state.barriers.low_barrier,
    basis_value: state.basis.value,
    currency_value: state.currency.value,
    basis_amount: state.basis.amount,
    spreads_amount_per_point: state.spreads.amount_per_point,
    spreads_stop_type: state.spreads.stop_type,
    spreads_stop_loss: state.spreads.stop_loss,
    spreads_stop_profit: state.spreads.stop_profit
  };
};

function set_current_template(state, tpl) {
  state.template.name = tpl.name;
  var warn = function(msg) { $.growl.warning({ message: msg || 'Template applied partially.'.i18n() }); }
  if(!_.find(state.categories.array, tpl.categories_value)) {
    $.growl.error({ message: 'Template is not applicable.'.i18n() });
    return;
  }
  state.categories.selected = tpl.categories_value.contract_category;
  _.defer(function() {
    if(!_.find(state.category_displays.array,
      type => type.name===tpl.categoriy_displays_selected.name && type.sentiment===tpl.categoriy_displays_selected.sentiment)) {
      warn();
      return;
    }
    state.category_displays.selected = tpl.categoriy_displays_selected;
    _.defer(function() {
      if(state.date_start.visible) {
        _.defer(function() {
          if (state.date_start.value !== 'now' && _.some(state.date_start.array, {value: tpl.date_start_value*1})) {
            state.date_start.value = tpl.date_start_value*1;
          } else {
            state.date_start.value = 'now';
          }
        });
      }
      if(state.digits.visible) {
        state.digits.value = tpl.digits_value;
      }
      if(state.categories.value.contract_category !== 'spreads') { /* <----- duration */
        state.duration.value = tpl.duration_value;
        if(state.duration.value === 'Duration' ) {
          _.defer(function() {
            state.duration_unit.value = tpl.duration_unit_value;
            _.defer(function() {
              state.duration_count.value = tpl.duration_count_value;
            });
          });
        }
        if(state.duration.value === 'End Time') {
          _.defer(function() {
              state.date_expiry.value_date = tpl.expiry_value_date;
              var is_today = !moment.utc(state.date_expiry.value_date).isAfter(moment.utc(),'day');
              if(is_today) {
                _.defer(function() {
                  state.date_expiry.value_hour = tpl.expiry_value_hour;
                });
              }
          });
        }
      } /* <---- duration */

      state.barriers.barrier_count = tpl.barriers_barrier_count;
      if(state.barriers.barrier_count === 1) {
        _.defer(function() {
          state.barriers.barrier = tpl.barriers_barrier;
        });
      }
      if(state.barriers.barrier_count === 2) {
        _.defer(function() {
          state.barriers.high_barrier = tpl.barriers_high_barrier;
          state.barriers.low_barrier = tpl.barriers_low_barrier;
        });
      }
      /* <---- barriers */

      if(state.categories.value.contract_category !== 'spreads') {
        _.defer(function() {
          state.basis.value = tpl.basis_value;
          state.currency.value = state.currency.value ? state.currency.value : tpl.currency_value;
          state.basis.amount = tpl.basis_amount;
        });
      } /* <----- basis, currency */

      if(state.categories.value.contract_category === 'spreads') {
          state.currency.value = tpl.currency_value;
          state.spreads.amount_per_point = tpl.spreads_amount_per_point;
          state.spreads.stop_type = tpl.spreads_stop_type;
          state.spreads.stop_loss = tpl.spreads_stop_loss;
          state.spreads.stop_profit = tpl.spreads_stop_profit;

      } /* <---- Spreads */
    });
  })
}

function validateHour({ hour, today_times, selected_date_unix }) {
  const formatted = moment.unix(+selected_date_unix).format('YYYY-MM-DD');
  const is_today = !moment.utc(formatted).isAfter(moment.utc(),'day');
  if (!is_today) return true;

  const { close, open } = today_times;
  if (open === '--') return true;

  const now        = moment.utc();
  const close_hour = moment(close, 'HH:mm:ss').hour();
  let   open_hour  = moment(open, 'HH:mm:ss').hour();

  if (now.hour() >= open_hour && now.hour() <= close_hour) {
    open_hour = now.hour();
  }

  return (hour >= open_hour && hour <= close_hour) ||
         (hour <= close_hour && close_hour <= open_hour) ||
         (hour >= open_hour && open_hour >= close_hour);
}

function validateMinute({ hour, minute, today_times, selected_date_unix }) {
  const formatted = moment.unix(+selected_date_unix).format('YYYY-MM-DD');
  const is_today = !moment.utc(formatted).isAfter(moment.utc(),'day');
  if (!is_today) return true;

  const { close, open } = today_times;
  if (open === '--') return true;

  const now          = moment.utc(),
        close_hour   = moment(close, 'HH:mm:ss').hour(),
        close_minute = moment(close, 'HH:mm:ss').minute();
  let open_hour      = moment(open, 'HH:mm:ss').hour(),
      open_minute    = moment(open, 'HH:mm:ss').minute();

  if (now.hour() >= open_hour && now.hour() <= close_hour) {
    open_hour =  now.hour();
    open_minute = now.minute();
  }
  if (open_hour === hour) return minute >= open_minute;
  if (close_hour === hour) return minute <= close_minute;

  return (hour > open_hour && hour < close_hour) || hour < close_hour || hour > open_hour;
}

function hasIntradayUnit(duration_unit_array) {
  return duration_unit_array.some(unit => ['ticks', 'seconds', 'minutes', 'hours'].indexOf(unit) !== -1);
}

function init_state(available,root, dialog, symbol, contracts_for_spot) {
  var state = {
    duration: {
      array: ['Duration', 'End Time'],
      value: 'Duration',
    },
    duration_unit: {
      array: [''],
      ranges: [{min: 1, max:365}],
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
      hour_minute: '',
      today_times: { open: '--', close: '--' }, /* trading times for today */
      onHourShow: function(hour) { /* for timepicker */
        return validateHour({
          hour,
          today_times: state.date_start.today_times,
          selected_date_unix: state.date_start.value,
        });
      },
      onMinuteShow: function(hour, minute) {
        return validateMinute({
          hour,
          minute,
          today_times: state.date_start.today_times,
          selected_date_unix: state.date_start.value,
        });
      }
    },
    date_expiry: {
      value_date: moment.utc().format('YYYY-MM-DD'), /* today utc in yyyy-mm-dd format */
      value_hour: moment.utc().format('HH:mm'), /* now utc in hh:mm format */
      value: 0,    /* epoch value of date+hour */
      today_times: { open: '--', close: '--', disabled: false }, /* trading times for today */
      min_date: 0,
      onHourShow: function(hour) { /* for timepicker */
        return validateHour({
          hour,
          today_times: state.date_expiry.today_times,
          selected_date_unix: state.date_expiry.value,
        });
      },
      onMinuteShow: function(hour, minute) {
        return validateMinute({
          hour,
          minute,
          today_times: state.date_expiry.today_times,
          selected_date_unix: state.date_expiry.value,
        });
      }
    },
    categories: {
      array: [],
      value: '',
      paddingTop: function() {
        var paddings = { "asian" : '26px', "callput" : '8px', "digits" : '14px', "endsinout" : '4px', "staysinout" : '4px', "touchnotouch" : '12px' , "lookback":'26px', "callputequal" : '8px'};
        return paddings[state.categories.value.contract_category] || '3px';
      }
    },
    category_displays: {
      array: [],
      selected: ''
    },
    barriers: {
      is_offset_barrier: false,
      is_offset_low_barrier: false,
      is_offset_high_barrier: false,
      barrier_count: 0,
      barrier : '',
      perv_barrier: '', // previous barrier value for intraday and tick contracts.
      was_perv_barrier_daily: false, // was the perv barrier a daily one?
      high_barrier: '',
      perv_high_barrier: '',
      was_perv_high_barrier_daily: false,
      low_barrier: '',
      perv_low_barrier: '',
      was_perv_low_barrier_daily: false,
      barrier_live: function() { return this.barrier * 1 + state.tick.quote * 1; },
      high_barrier_live: function() { return this.high_barrier * 1 + state.tick.quote * 1; },
      low_barrier_live: function() { return this.low_barrier * 1 + state.tick.quote * 1; },
    },
    digits: {
      array: ['0', '1','2','3','4','5','6','7','8','9'],
      value: '0',
      visible: false,
      text: 'Last Digit Prediction'.i18n()
    },
    currency: {
      array: ['USD'],
      value: 'USD',
      decimals: currencyFractionalDigits(),
    },
    basis: {
      array: ['Payout', 'Stake'],
      value: 'payout',
      amount: currencyFractionalDigits() === 8 ? 0.10000000 : 10,
      limit: null,
    },
    spreads: {
      amount_per_point: 1,
      stop_type: 'point', /* could be 'point' or 'dollar' */
      stop_loss: (_.find(available, 'stop_loss') || { stop_loss: 10}).stop_loss,
      stop_profit: (_.find(available, 'stop_profit') || { stop_profit: 10}).stop_profit,
      /* updated from #proposal websocket api */
      spread: 0.0,
      spot: '0.0',
      spot_time: '0',
      deposit_: function(){
        if(this.stop_type === 'point')
          return this.stop_loss * this.amount_per_point;
        else // 'dollar'
          return this.stop_loss;
      }
    },
    tick: {
      epoch: '0',
      quote: contracts_for_spot,
      perv_quote: '0',
      down: function(){
        var ans= this.quote*1 < this.perv_quote*1;
        return ans;
      }
    },
    ticks: {
      array: [], /* ticks for sparkline chart */
      loading: true,
    },
    proposal: {
      symbol: symbol.symbol,
      symbol_name: symbol.display_name,
      last_promise: null,
      id: '', /* id of last proposal request sent */
      ask_price: "0.0",
      date_start: 0,
      display_value: "0.0",
      message: 'Loading ...'.i18n(), /* longcode */
      payout: 0,
      spot: "0.0",
      spot_time: "0",
      multiplier: "0",
      error: '',
      loading: true, /* the proposal request state */
      pip: getSymbolPipValue(symbol.symbol),
      /* computed properties */
      netprofit_: function () {
        const {contract_type} = state.category_displays.selected;
        if (Lookback.isLookback(contract_type)) {
          return false;
        }
        return formatPrice(((this.payout - this.ask_price) || 0), state.currency.value);
      },
      payout_: function () {
        const {contract_type} = state.category_displays.selected;
        if (Lookback.isLookback(contract_type)) {
          return Lookback.formula(contract_type, formatPrice((+state.basis.amount || 0), state.currency.value, 3));
        } else {
          return formatPrice((+this.payout || 0), state.currency.value);
        }
      },
      return_: function () {
        const {contract_type} = state.category_displays.selected;
        if (Lookback.isLookback(contract_type) || !this.payout || ! this.ask_price) {
          return false;
        }
        return `${((this.payout - this.ask_price)/this.ask_price * 100).toFixed(1)}%`;
      }
    },
    purchase: {
      loading: false, /* is the purchased button clicked and confirmation dialog is loading */
    },
    tooltips: {
      barrier: { my: "left-215 top+10", at: "left bottom", collision: "flipfit" },
      barrier_p: { my: "left-5 top+10", at: "left bottom", collision: "flipfit" },
    },
    template: {
      name: '',
      visible: false,
    },
  };

  var update_currency = function() {
    /* change currency on user login */
    if(liveapi.is_authenticated()) {
      state.currency.value = local_storage.get('authorize').currency;
      state.currency.array = [local_storage.get('authorize').currency];
    }
  };

  state.template.hide = function(e) {
    if($(e.target).closest('.trade-template-manager').length === 0) {
      state.template.visible = false;
    }
  }
  state.template.toggle = function() {
    state.template.visible = !state.template.visible;
  }

  state.barriers.root = state; // reference to root object for computed properties

  state.date_expiry.update_times = function(){
      trading_times_for(state.date_expiry.value_date, state.proposal.symbol)
        .then(function(times) {
          state.date_expiry.today_times.open = times.open;
          state.date_expiry.today_times.close = times.close;
          var range = _(state.duration_unit.ranges).filter(['type', 'minutes']).head();
          state.date_expiry.today_times.disabled = !range;
          var value_hour = range ? moment.utc().add(range.min+1, 'm').format('HH:mm') : "00:00";
          state.date_expiry.value_hour = value_hour;
          // /* avoid 'Contract may not expire within the last 1 minute of trading.' */
          // value_hour = moment(times.close, 'HH:mm:ss').subtract(1, 'minutes').format('HH:mm');
          // expiry.value_hour = value_hour < expiry.value_hour ? value_hour : expiry.value_hour;
      });
  }

  state.categories.update = function (msg) {
    state.categories.value = _.find(state.categories.array,{contract_category: state.categories.selected});
    var category = state.categories.value.contract_category;
    var isInOut = v => ['staysinout', 'endsinout'].indexOf(v) !== -1;
    const check = isInOut(category) ? el => isInOut(el.contract_category) : el => el.contract_category == category;
    const isLookback = v => /^lookback$/.test(v.toLowerCase());
    state.category_displays.array = [];
    _(available).filter(check).map('contract_display').uniq().value().forEach(
      x => {
        let y = {};
        y.name = x;
        let category_object = _.find(available, {contract_display:x});
        if (category_object){
          y.sentiment = category_object.sentiment;
          y.contract_type = category_object.contract_type;
        }

        state.category_displays.array.push(y);
    });
    if (isLookback(category)) {
      state.basis.array = ['Multiplier'];
      state.basis.value = 'multiplier';
      state.currency.decimals = 3;
    } else {
      state.basis.array = ['Payout', 'Stake'];
      state.basis.value = 'payout';
      state.currency.decimals = currencyFractionalDigits();
    }
    state.category_displays.selected = _.head(state.category_displays.array);
  };

  state.category_displays.onclick = function (e) {
    state.category_displays.selected = {};
    state.category_displays.selected.name = $(e.target).attr('data-name');
    state.category_displays.selected.sentiment = $(e.target).attr('data-sentiment');
    state.category_displays.selected.contract_type = $(e.target).attr('data-contract_type');
  };

  state.date_start.update = function () {
    const forward_starting_market = 
      _(available)
        .filter({
          'contract_category_display': state.categories.value.contract_category_display,
          'contract_display': state.category_displays.selected.name,
          'start_type': 'forward'
        })
        .head();

    if (!forward_starting_market) {
      _.assign(state.date_start, { visible: false, array: [], value: 'now' });
      return;
    };

    const spot_starting_options = 
      _(available)
        .filter({
          'contract_category_display': state.categories.value.contract_category_display,
          'contract_display': state.category_displays.selected.name,
          'start_type': 'spot'
        })
        .head();

    const start_dates = forward_starting_market.forward_starting_options.map((available_day) => {
      const { date } = available_day;
      const text = moment.unix(date).format('ddd - MMMM Do, YYYY');
      return { text, value: date };
    });

    if (spot_starting_options) {
      start_dates.unshift({ text: 'Now', value: 'now' });
    } else {
      state.date_start.value = start_dates[0].value;
    }
    const { value: selected_date } = state.date_start;
  
    const options = { 
      value: selected_date, 
      array: [...start_dates], 
      visible: true 
    };

    _.assign(state.date_start, options);

    if (selected_date === 'now') {
      state.date_start.hour_minute = '00:00';
    } else {
      state.setDateStartHourMinute(state.date_start.hour_minute);
    }
  };

  state.setDateStartHourMinute = (hour_minute) => {
    const date_start_formatted                 = moment.unix(+state.date_start.value).format('YYYY-MM-DD');
    const date_start_with_selected_hour_minute = moment.utc(`${date_start_formatted} ${hour_minute}`).unix();
    const is_today                             = !moment.utc(date_start_formatted).isAfter(moment.utc(), 'day');

    trading_times_for(date_start_formatted, state.proposal.symbol).then(data => {
      state.date_start.today_times.open = data.open;
      state.date_start.today_times.close = data.close;

      if (is_today) {
        const now_hour_minute = moment.utc().format('HH:mm');
        state.date_start.hour_minute = now_hour_minute > hour_minute ? now_hour_minute : hour_minute;
      } else {
        state.date_start.hour_minute = hour_minute;
      }

      state.date_start.value = date_start_with_selected_hour_minute;
    });
  }

  state.date_expiry.update = function (date_or_hour) {
    /* contracts that are more not today must end at the market close time */
    const { value_date } = state.date_expiry;
    const is_today = !moment.utc(value_date).isAfter(moment.utc(), 'day');
    const is_duration = state.duration.value === 'Duration';
    const is_daily_contracts = state.duration_unit.array[0] && !hasIntradayUnit(state.duration_unit.array);

    if (!is_today) {
      state.date_expiry.today_times.disabled = true;
        trading_times_for(value_date, state.proposal.symbol)
          .then(function(times){
            if (is_duration) {
              state.date_expiry.value_date = moment.utc().format('YYYY-MM-DD');
            }

            const value_hour = times.close !== '--' ? times.close : '23:59:59';
            state.date_expiry.min_date = is_daily_contracts ? 1 : 0;
            state.date_expiry.value_hour = moment.utc(value_hour, 'HH:mm:ss').format('HH:mm');
            state.date_expiry.value = moment.utc(state.date_expiry.value_date + ' ' + value_hour).unix();
            state.barriers.update();

            debounce(state.date_expiry.value, state.proposal.onchange);
          });
    }
    else {
        if (date_or_hour !== state.date_expiry.value_hour) { state.date_expiry.update_times(); }
        if (is_daily_contracts && !is_duration) {
          state.date_expiry.min_date = 1;
          state.date_expiry.value_date = moment.utc().add(1, 'days').format('YYYY-MM-DD');
        }
        state.date_expiry.value = moment.utc(state.date_expiry.value_date + ' ' + state.date_expiry.value_hour).unix();
        state.barriers.update();
        debounce(state.date_expiry.value, state.proposal.onchange);
    }
  }

  state.duration.update = function () {
    var category = state.categories.value.contract_category;
    if (_(["callput", "endsinout", "staysinout", "touchnotouch", "lookback"]).includes(category)) {
      if(state.duration.array.length !== 2)
        state.duration.array = ['Duration', 'End Time'];
    }
    else {
      state.duration.value = 'Duration';
      if(state.duration.array.length !== 1)
        state.duration.array = ['Duration'];
    }
  };

  state.duration_unit.update = function () {
    var start_type = state.date_start.value !== 'now' ? 'forward' : 'spot';
    var durations = _(available).filter({
      'contract_category_display': state.categories.value.contract_category_display,
      'contract_display': state.category_displays.selected.name,
      'start_type': start_type
    })
    .map(function (r) {
      return {
        min: r.min_contract_duration + '',
        max: r.max_contract_duration + '',
        type: r.expiry_type
      }
    }).value();

    var array = [];
    var ranges = [];
    _.each(durations, function (d) {
      if (_(['tick', 'daily']).includes(d.type)) {
        array.push({ tick: 'ticks', daily: 'days' }[d.type]);
        ranges.push({
          min: d.min.replace('d', '').replace('t','') | 0,
          max: d.max.replace('d', '').replace('t','') | 0,
          type: { tick: 'ticks', daily: 'days' }[d.type]
        });
        return;
      }
      /* fix intraday duration intervals */
      var min = d.min.replace('s', '').replace('m', '').replace('h',''),
          max = d.max.replace('s', '').replace('m', '').replace('h','').replace('d', '');
      var min_unit = _(d.min).last(),
          max_unit = _(d.max).last();

      min *= { 's': 1, 'm': 60, 'h': 3600 }[min_unit];                 // convert to seconds
      max *= { 's': 1, 'm': 60, 'h':3600, 'd': 3600 * 24 }[max_unit];

      if('s' === min_unit) {
        array.push('seconds');
        ranges.push({ min: min, max: max, type: 'seconds'});
      }
      if(_(['s', 'm']).includes(min_unit) && max >= 60) {
        array.push('minutes');
        ranges.push({ min: Math.max(min / 60, 1), max: max / 60, type: 'minutes' });
      }
      if(_(['s', 'm', 'h']).includes(min_unit) && max >= 3600) {
        array.push('hours');
        ranges.push({ min: Math.max(min / 3600, 1), max: max / 3600, type: 'hours' });
      }
    });

    /* sort the arrays */
    var sort_dict = { 'ticks': 0, 'seconds': 1, 'minutes': 2, 'hours': 3, 'days': 4 };
    array.sort(function (r1, r2) { return sort_dict[r1] - sort_dict[r2]; });
    ranges.sort(function(r1,r2){ return sort_dict[r1.type] - sort_dict[r2.type]; })

    if (!array.length) {
      state.barriers.update();
      return;
    }

    state.duration_unit.ranges = ranges;
    if(!_.includes(array,state.duration_unit.value)){
      state.duration_unit.value = _.head(array);
    }
    else {
      state.duration_count.update(true);
    }
    // disable other durations besides minutes for lookbacks
    if (state.categories.selected === 'lookback') {
      array = array.filter((duration) => duration === 'minutes')
    }

    state.duration_unit.array = array;
    /* manualy notify 'duration_count' and 'barriers' to update themselves */
    state.barriers.update();
    state.date_expiry.update_times();
  };

  state.duration_count.update = function (try_to_keep_value) {
    var range = _(state.duration_unit.ranges).filter({'type': state.duration_unit.value}).head();
    if (!range) return;
    state.duration_count.min = range.min;
    state.duration_count.max = range.max;
    if(try_to_keep_value !== true) {
      state.duration_count.value = range.min;
    }
    else if(state.duration_count.value < range.min || state.duration_count.value > range.max) {
      state.duration_count.value = range.min;
    }
  };

  state.digits.update = function() {
      var subcat = state.category_displays.selected.sentiment;
      if(state.categories.value.contract_category !== 'digits' || subcat === 'odd' || subcat === 'even') {
        state.digits.visible = false;
        return;
      }

      var array = {
        match: ['0', '1','2','3','4','5','6','7','8', '9'],
        differ: ['0', '1','2','3','4','5','6','7','8', '9'],
        under: ['1','2','3','4','5','6','7','8', '9'],
        over: ['0','1','2','3','4','5','6','7','8'],
      }[subcat];
      var text = {
        match: 'Last Digit Prediction'.i18n(),
        differ: 'Last Digit Prediction'.i18n(),
        under: 'Last Digit is Under'.i18n(),
        over: 'Last Digit is Over'.i18n()
      }[subcat];

      if(!_.includes(array, state.digits.value)){
        state.digits.value = array[0];
      }
      state.digits.array = array;
      state.digits.text = text;
      state.digits.visible = true;
  };

  state.barriers.update = function () {
    var unit = state.duration_unit.value;
    var expiry_type = _(['seconds', 'minutes', 'hours']).includes(unit) ? 'intraday' : unit === 'days' ? 'daily' : 'tick';
    var barriers = _(available).filter({
      'contract_category_display': state.categories.value.contract_category_display,
      'contract_display': state.category_displays.selected.name,
      'expiry_type':expiry_type
    }).filter(function (r) { return r.barriers >= 1; }).head();

    state.barriers.barrier_count = barriers ? barriers.barriers : 0;
    if (!barriers)
      return;

     var update_barrier = function(barrier, perv_barrier, new_barrier, was_perv_barrier_daily, sign) {
        var is_daily = (expiry_type === 'daily' && state.duration.value !== 'End Time') ||
           (state.duration.value === 'End Time' && moment.utc(state.date_expiry.value_date).isAfter(moment.utc(),'day'));
        if(is_daily) {
           if(was_perv_barrier_daily) {
              perv_barrier = barrier;
           }
           barrier = (was_perv_barrier_daily ? barrier : 0) || new_barrier;
           was_perv_barrier_daily = true;
        }
        else {
           var def_barrier = (new_barrier*1 >= 0 ? sign : '') + new_barrier*1;
           if(was_perv_barrier_daily && /^[+-]/.test(perv_barrier)) {
              barrier = perv_barrier;
           }
           else if(!/^[+-]/.test(barrier)) {
              barrier = def_barrier;
           }
           else {} // no need to update it
           perv_barrier = barrier;
           was_perv_barrier_daily = false;
        }
        return {
           barrier: barrier,
           perv_barrier: perv_barrier,
           was_perv_barrier_daily: was_perv_barrier_daily
        };
     }
    if(barriers.barrier) {
       var result = update_barrier(state.barriers.barrier, state.barriers.perv_barrier,
          barriers.barrier, state.barriers.was_perv_barrier_daily, '+');
       state.barriers.barrier = result.barrier;
       state.barriers.perv_barrier = result.perv_barrier;
       state.barriers.was_perv_barrier_daily = result.was_perv_barrier_daily;
    }
    if(barriers.high_barrier){
       var result = update_barrier(state.barriers.high_barrier, state.barriers.perv_high_barrier,
          barriers.high_barrier, state.barriers.was_perv_high_barrier_daily, '+');
       state.barriers.high_barrier = result.barrier;
       state.barriers.perv_high_barrier = result.perv_barrier;
       state.barriers.was_perv_high_barrier_daily = result.was_perv_barrier_daily;
    }
    if(barriers.low_barrier){
       var result = update_barrier(state.barriers.low_barrier, state.barriers.perv_low_barrier,
          barriers.low_barrier, state.barriers.was_perv_low_barrier_daily, '-');
       state.barriers.low_barrier = result.barrier;
       state.barriers.perv_low_barrier = result.perv_barrier;
       state.barriers.was_perv_low_barrier_daily = result.was_perv_barrier_daily;
    }
  };

  state.basis.update_limit = function () {
    var basis = state.basis;
    var limit = _(available).filter({
      'contract_category_display': state.categories.value.contract_category_display,
      'contract_display': state.category_displays.selected.name
    }).head();

    limit = (limit && limit.payout_limit) || null;
    basis.limit = limit ? (limit * 1) : null;
    if(basis.limit) {
      basis.amount = Math.min(basis.amount, basis.limit);
    }
  };

  state.proposal.onchange = function () {
    const unit = state.duration_unit.value;
    let expiry_type = _(['seconds', 'minutes', 'hours']).includes(unit) ? 'intraday' : unit === 'days' ? 'daily' : 'tick';
    const subcat = state.category_displays.selected.sentiment;
    if(state.categories.value.contract_category === 'spreads') expiry_type = 'intraday';
    const row = _(available).filter({
      'contract_category_display': state.categories.value.contract_category_display,
      'contract_display': state.category_displays.selected.name,
      'expiry_type': expiry_type
    }).head();
    const request = {
      proposal: 1,
      subscribe: 1,
      contract_type: row ? row.contract_type : '',
      currency: state.currency.value, /* This can only be the account-holder's currency */
      symbol: state.proposal.symbol, /* Symbol code */
    };
    if(state.categories.value.contract_category !== 'spreads') {
      const format_amount = _.isNil(state.basis.amount) ? false : state.basis.amount.toString().match(/0*(\d+\.?\d*)/);
      //  format the amount only if the invalid input is invalid
      if (format_amount && format_amount.input !== format_amount[1]) {
        state.basis.amount = format_amount[1];
      }
      request.amount = state.basis.amount; /* Proposed payout or stake value */
      request.basis = state.basis.value; /* Indicate whether amount is 'payout' or 'stake */
    } else {
      request.amount_per_point = state.spreads.amount_per_point;
      request.stop_type = state.spreads.stop_type;
      request.stop_loss = state.spreads.stop_loss;
      request.stop_profit = state.spreads.stop_profit;
    }

    add_barriers_to_request(state, request);
    set_is_barrier_offset(state);

    if (state.categories.value.contract_category === 'digits' && !(subcat === 'odd' || subcat === 'even')) {
      request.barrier = state.digits.value + '';
    }
    if (state.date_start.value !== 'now') {
      request.date_start = state.date_start.value * 1;
    }
    /* set value for duration or date_expiry */
    if (state.duration.value === 'Duration') {
      request.duration_unit = _(state.duration_unit.value).head(); //  (d|h|m|s|t), Duration unit is s(seconds), m(minutes), h(hours), d(days), t(ticks)
      request.duration = state.duration_count.value * 1;
    }
    else {
      request.date_expiry = state.date_expiry.value;
    }

    state.proposal.loading = true;
    /* forget previous proposal request */
    if(state.proposal.last_promise) {
      state.proposal.last_promise.then(function(data){
        var id = data && data.proposal && data.proposal.id;
        id && liveapi.send({forget: id});
      });
    }

    async function subscribeProposalHandler(request, times_to_retry, required_err_code_for_retry) {
      let response;
      for (let i = 0; i < times_to_retry; i++) {
        try {
          const { contract_type } = state.category_displays.selected;
          if (Lookback.isLookback(contract_type)) {
            const lookback_request = Lookback.makeLookbackRequest(request);
            response = await liveapi.send(lookback_request);
          } else {
            response = await liveapi.send(request);
          }
          state.proposal.error = '';
          state.proposal.id = response.proposal && response.proposal.id;
          break;
        } catch (err) {
          state.proposal.error = err.message;
          state.proposal.message = '';
          state.proposal.loading = false;
          if (required_err_code_for_retry && required_err_code_for_retry !== err.code) { break; }
        }
      }
      return response;
    }

    const new_proposal_promise = subscribeProposalHandler(request, 2, 'AlreadySubscribed');
    /* update last_promise to invalidate previous requests */
    state.proposal.last_promise = new_proposal_promise;
    state.proposal.id = ''; /* invalidate last proposal.id */

    dialog.update_track(dialog.get_template());
  };

  function add_barriers_to_request(state, request) {
    const { barrier, high_barrier, low_barrier, barrier_count } = state.barriers;
    if (+barrier_count === 2) {
      request.barrier = high_barrier;
      request.barrier2 = low_barrier;
      return;
    }
    if (+barrier_count === 1) request.barrier = barrier;
  }

  function set_is_barrier_offset(state) {
    state.barriers.is_offset_barrier = is_offset(state.barriers.barrier);
    state.barriers.is_offset_low_barrier = is_offset(state.barriers.low_barrier);
    state.barriers.is_offset_high_barrier = is_offset(state.barriers.high_barrier);
  }

  function is_offset(barrier) {
    return barrier && (barrier.startsWith('+') || barrier.startsWith('-')) ? true : false;
  }

  state.purchase.onclick = async function() {
    const categories_with_tick_chart = ['digits', 'callput', 'callputequal', 'asian', 'touchnotouch'];
    state.purchase.loading = true;
    var show = function(div){
      div.appendTo(root);

      root.find('.trade-fields').css({ left : '400px'});
      root.find('.trade-conf').css({ left : '0'});
    };
    var hide = function(div){
      root.find('.trade-fields').css({ left : '0'});
      root.find('.trade-conf').css({ left : '-400px'});
      state.purchase.loading = false;
      div.remove();
      /* trigger a new proposal stream */
      state.proposal.onchange();
    }

    /* workaround for api not providing this fields */
    var extra = {
        amount: state.basis.amount,
        currency: state.currency.value,
        symbol: state.proposal.symbol,
        symbol_name: state.proposal.symbol_name,
        category: state.categories.value,
        category_display: state.category_displays.selected,
        duration_unit: state.duration_unit.value,
        pip: symbol.pip,
    };
    /* pass data which is needed to show live tick purchase results */
    extra.show_tick_chart = false;
    if(_(categories_with_tick_chart).includes(extra.category.contract_category) && state.duration.value === 'Duration' && extra.duration_unit === 'ticks') {
        extra.digits_value = state.digits.value;
        extra.tick_count = state.duration_count.value*1;
        if(extra.category.contract_category !== 'digits') {
          if (extra.category.contract_category !== 'asian') {
            extra.tick_count += 1; /* we are shwoing X ticks arfter the initial tick so the total will be X+1 */
          }
          /* for higher/lower final barrier value is entry_quote + barrrier */
          if(extra.category.contract_category === 'callput' && !_(['rise','fall']).includes(extra.category_display.name)) {
            extra.barrier = state.barriers.barrier;
          }
          extra.show_tick_chart = true;
        }
    }
    // manually check to see if the user is authenticated or not,
    // we should update state.currency from user profile first (not everyone is using USD)
    if(!liveapi.is_authenticated()) {
        $.growl.warning({ message: 'Please log in'.i18n() });
        state.purchase.loading = false;
        return;
    }
    try {
        const [tradeConf] = await require(['trade/tradeConf']);
        const data = await liveapi.send({
                buy: state.proposal.id,
                price: state.proposal.ask_price * 1,
             });
        extra.contract_id = data.buy.contract_id;
        extra.transaction_id = data.buy.transaction_id;
        if(extra.show_tick_chart || extra.category.contract_category === 'digits') {
          liveapi.proposal_open_contract.subscribe(extra.contract_id);
        }
        tradeConf.init(data, extra, show, hide, symbol);
    }
    catch(err) {
        state.purchase.loading = false;
        $.growl.error({ message: err.message });
        console.error(err);
        /*Logout if the error code is 42*/
        if (err.code === 'InvalidToken') {
          liveapi.invalidate();
        } else {
          /* trigger a new proposal stream */
          state.proposal.onchange();
        }
    }
  };

  _(available)
    .map('contract_category')
    .uniq()
    .value()
    // TODO: Remove this filter after implementing reset, high/low, spread, runs contracts.
    .filter(f => SUPPORTED_CONTRACT_TYPES.includes(f.toLowerCase()))
    .forEach(x => {
      let y = {};
      y.contract_category = x;
      let contract_object = _.find(available, {contract_category: x});
      if (contract_object) {
        y.contract_category = contract_object.contract_category;
        y.contract_category_display = contract_object.contract_category_display
        state.categories.array.push(y);
      }
    });

  state.categories.value = _(state.categories.array).head(); // TODO: show first tab
  state.categories.selected = state.categories.value.contract_category;

  var tick_stream_alive = false;
  /* register for tick stream of the corresponding symbol */
  liveapi.events.on('tick', function (data) {
      if (data.tick && data.tick.symbol == state.proposal.symbol) {
          tick_stream_alive = true;
          // if(state.purchase.loading) return; /* don't update ui while loading confirmation dialog */
          state.tick.perv_quote = state.tick.quote;
          state.tick.epoch = data.tick.epoch;
          state.tick.quote = data.tick.quote;
          state.ticks.loading = false;
          /* update ticks for sparkline chart */
          if(state.ticks.array.length > 25) {
            state.ticks.array.shift();
          }
          state.ticks.array.push(data.tick);
      }
  });
  /* register for proposal event */
  liveapi.events.on('proposal', function (data) {
      // Specifically for microsoft products. Need to wait for other functions to finish
      //We can move the code out of the defer function once windows becomes obsolete or if it stops making browsers. >.<
      _.defer(function(){
          if (!data.proposal || data.proposal.id !== state.proposal.id) return;
          if(data.error){
            console.error(data.error);
            state.proposal.error = data.error.message;
            state.proposal.message = '';
            return;
          }
          if(state.purchase.loading) return; /* don't update ui while loading confirmation dialog */
          /* update fields */
          var proposal = data.proposal;
          state.proposal.ask_price = proposal.ask_price;
          state.proposal.date_start = proposal.date_start;
          state.proposal.multiplier = proposal.multiplier || '0';
          state.proposal.display_value = proposal.display_value;
          state.proposal.message = proposal.longcode;
          state.proposal.payout = proposal.payout;
          state.proposal.spot = proposal.spot;
          state.proposal.spot_time = proposal.spot_time;
          state.spreads.spread = proposal.spread || 0.0;
          state.spreads.spot = proposal.spot || '0.0';
          state.spreads.spot_time = proposal.spot_time || '0';
          state.proposal.loading = false;
          if(!tick_stream_alive && proposal.spot) { /* for contracts that don't have live qoute data */
            state.tick.epoch = proposal.spot_time;
            state.tick.quote = proposal.spot;
          }
      });
  });

  liveapi.events.on('set_account_currency', update_currency);
  liveapi.events.on('login', update_currency);
  update_currency();

  return state;
}
export function init(symbol, contracts_for, saved_template, isTrackerInitiated) {
    var root = $(html).i18n();
    var available = apply_fixes(contracts_for.available);

    var dialog = windows.createBlankWindow(root, {
        title: symbol.display_name,
        resizable: false,
        collapsable: false,
        minimizable: true,
        maximizable: false,
        width:  400,
        'data-authorized': 'false',
        'data-account-specific': 'true',
        isTrackerInitiated: isTrackerInitiated,
        relativePosition: true,
        close: function() {
          /* forget last proposal stream on close */
          if(state.proposal.last_promise) {
            state.proposal.last_promise.then(function(data){
              var id = data && data.proposal && data.proposal.id;
              id && liveapi.send({forget: id});
            });
          }
          chartingRequestMap.unregister(key);
          view.unbind();
          dialog.destroy();
        }
    });
    var update_track = dialog.track({
      module_id: 'tradeDialog',
      is_unique: false,
      data: {
        symbol : symbol,
        template: saved_template || {}
      }
    });

    /********************** register for ticks_streams **********************/
    var key = chartingRequestMap.keyFor(symbol.symbol, /* granularity = */ 0);
    var has_digits = _(available).map('min_contract_duration')
                      .some(function(duration){ return /^\d+$/.test(duration) || (_.last(duration) === 't'); });
    if(!chartingRequestMap[key]){ /* don't register if already someone else has registered for this symbol */
        chartingRequestMap.register({
          symbol: symbol.symbol,
          subscribe: 1,
          style: 'ticks'
        }).catch(function (err) {
          /* if this contract offers tick trades, prevent user from trading */
          if(has_digits) {
            $.growl.error({ message: err.message });
            _.delay(function(){ dialog.dialog('close'); },2000);
          }
          console.error(err);
        });
    }
    else { chartingRequestMap.subscribe(key); }

    var state = init_state(available,root,dialog, symbol, contracts_for.spot);
    if(!has_digits) { state.ticks.loading = false; }
    var view = rv.bind(root[0],state);
    state.categories.update();            // trigger update to init categories_display submenu

    dialog.dialog('open');

    dialog.update_track = function(template) {
      update_track({symbol: symbol, template: template});
    };
    dialog.get_template = get_current_template.bind(undefined, state);
    dialog.set_template = set_current_template.bind(undefined, state);
    saved_template && (saved_template.name !== undefined) && dialog.set_template(saved_template);
    dialog.hide_template_menu = () => { state.template.visible = false; };
    require(['trade/tradeTemplateManager'], function(tradeTemplateManager) {
      tradeTemplateManager.init(root.find('.trade-template-manager-root'), dialog);
    });
    $('#duration-input').keypress((evt) => {
      if ((evt.which < 48 || evt.which > 57) && evt.which !== 8) {
          evt.preventDefault();
      }
    });
    // window.state = state; window.av = available; window.moment = moment; window.dialog = dialog; window.times_for = trading_times_for;
    return dialog; // used in tracker to set position.
}

export default { init, };
