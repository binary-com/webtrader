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
        times: { open: ["00:00:00"], close: ["23:59:59"], settlement: "23:59:59" },
        pip: "0.001"
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

define(['lodash', 'jquery', 'moment', 'windows/windows', 'common/rivetsExtra', 'websockets/binary_websockets', 'charts/chartingRequestMap', 'text!trade/tradeDialog.html', 'css!trade/tradeDialog.css', 'timepicker', 'jquery-ui', 'common/util'],
    function (_, $, moment, windows, rv, liveapi, chartingRequestMap, html) {
    require(['trade/tradeConf']); /* trigger async loading of trade Confirmation */
    var replacer = function (field_name, value) { return function (obj) { obj[field_name] = value; return obj; }; };
    var debounce = rv.formatters.debounce;

    function apply_fixes(available){
        /* fix for server side api, not seperating higher/lower frim rise/fall in up/down category */

        _(available).filter({
          'contract_category_display': 'Up/Down',
          'barrier_category' : 'euro_atm',
          'contract_display' : 'higher'
        }).each(replacer('contract_display', 'rise'));

        _(available).filter({
          'contract_category_display':'Up/Down',
          'barrier_category': 'euro_atm',
          'contract_display': 'lower',
        }).each(replacer('contract_display','fall'));
        /* fix for server side api, returning two different contract_category_displays for In/Out */
        _(available).filter(['contract_category_display', 'Stays In/Goes Out'])
                    .each(replacer('contract_category_display', 'In/Out'));
        _(available).filter(['contract_category_display', 'Ends In/Out'])
                    .each(replacer('contract_category_display', 'In/Out'));
        /* fix for websocket having a useless barrier value for digits */
        _(available).filter(['contract_category_display', 'Digits'])
                    .each(replacer('barriers', 0));
        /* fix for contract_display text in In/Out menue */
        _(available).filter(['contract_display', 'ends outside']).each(replacer('contract_display', 'ends out'));
        _(available).filter(['contract_display', 'ends between']).each(replacer('contract_display', 'ends in'));
        _(available).filter(['contract_display', 'stays between']).each(replacer('contract_display', 'stays in'));
        _(available).filter(['contract_display', 'goes outside']).each(replacer('contract_display', 'goes out'));
        _(available).filter(['contract_display', 'touches']).each(replacer('contract_display', 'touch'));
        _(available).filter(['contract_display', 'does not touch']).each(replacer('contract_display', 'no touch'));

        /* sort the items in the array according to the way we want to show them */
        available = _.sortBy(available,function(row){
          var rank = { 'Up/Down': 1, 'Touch/No Touch':2, 'In/Out': 3, 'Digits': 4, 'Asians': 5, 'Spreads': 6 }[row.contract_category_display];
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

    function init_state(available,root, dialog, symbol, contracts_for_spot){

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
        },
        date_expiry: {
          value_date: moment.utc().format('YYYY-MM-DD'), /* today utc in yyyy-mm-dd format */
          value_hour: moment.utc().format('HH:mm'), /* now utc in hh:mm format */
          value: 0,    /* epoch value of date+hour */
          today_times: { open: '--', close: '--', disabled: false }, /* trading times for today */
          onHourShow: function(hour) { /* for timepicker */
            var times = state.date_expiry.today_times;
            if(times.open === '--') return true;
            var now = moment.utc();
            var close_hour = moment(times.close, "HH:mm:ss").hour();
            var open_hour = moment(times.open, "HH:mm:ss").hour();
            if(now.hour() >= open_hour && now.hour() <= close_hour ) { open_hour =  now.hour(); }
            return (hour >= open_hour && hour <= close_hour) ||
                   (hour <= close_hour && close_hour <= open_hour) ||
                   (hour >= open_hour && open_hour >= close_hour);
          },
          onMinuteShow: function(hour,minute){
            var times = state.date_expiry.today_times;
            if(times.open === '--') return true;
            var now = moment.utc();
            var close_hour = moment(times.close, "HH:mm:ss").hour(),
                close_minute = moment(times.close, "HH:mm:ss").minute();
            var open_hour = moment(times.open, "HH:mm:ss").hour(),
                open_minute = moment(times.open, "HH:mm:ss").minute();
            if(now.hour() >= open_hour && now.hour() <= close_hour ) {
              open_hour =  now.hour();
              open_minute = now.minute();
            }
            if(open_hour === hour) return minute >= open_minute;
            if(close_hour === hour) return minute <= close_minute;
            return (hour > open_hour && hour < close_hour) || hour < close_hour || hour > open_hour;
          }
        },
        categories: {
          array: [],
          value: '',
          paddingTop: function(){
            var paddings = { "Asians" : '26px', "Up/Down" : '8px', "Digits" : '14px', "In/Out" : '4px', "Touch/No Touch" : '16px' , "Spreads":'5px' };
            return paddings[state.categories.value] || '3px';
          }
        },
        category_displays: {
          array: [],
          selected: ''
        },
        barriers: {
          barrier_count: 0,
          barrier : '',
          high_barrier: '',
          low_barrier: '',
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
        },
        basis: {
          array: ['Payout', 'Stake'],
          value: 'payout',
          amount: 10,
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
          error: '',
          loading: true, /* the proposal request state */

          /* computed properties */
          netprofit_: function () {
            return formatPrice(((this.payout - this.ask_price) || 0).toFixed(2), state.currency.value);
          },
          return_: function () {
            var ret = (((this.payout - this.ask_price) / this.ask_price) * 100);
            ret = (ret && ret.toFixed(1)) || 0;
            return ret + '%';
          }
        },
        purchase: {
          loading: false, /* is the purchased button clicked and confirmation dialog is loading */
        },
        tooltips: {
          barrier: { my: "left-215 top+10", at: "left bottom", collision: "flipfit" },
          barrier_p: { my: "left-5 top+10", at: "left bottom", collision: "flipfit" },
        },
      };
      state.barriers.root = state; // reference to root object for computed properties

      state.date_expiry.update_times = function(){
          trading_times_for(state.date_expiry.value_date, state.proposal.symbol)
            .then(function(times) {
              var expiry = state.date_expiry;
              expiry.today_times.open = times.open;
              expiry.today_times.close = times.close;
              var range = _(state.duration_unit.ranges).filter(['type', 'minutes']).head();
              expiry.today_times.disabled = !range;
              var value_hour = range ? moment.utc().add(range.min+1, 'm').format('HH:mm') : "00:00";
              expiry.value_hour = value_hour > expiry.value_hour ? value_hour : expiry.value_hour;
              // /* avoid 'Contract may not expire within the last 1 minute of trading.' */
              // value_hour = moment(times.close, 'HH:mm:ss').subtract(1, 'minutes').format('HH:mm');
              // expiry.value_hour = value_hour < expiry.value_hour ? value_hour : expiry.value_hour;
          });
      }

      state.categories.update = function () {
        var name = state.categories.value;
        state.category_displays.array = _(available).filter(['contract_category_display', name]).map('contract_display').uniq().value();
        state.category_displays.selected = _.head(state.category_displays.array);
      };

      state.category_displays.onclick = function (e) {
        state.category_displays.selected = $(e.target).attr('data');
      };

      state.date_start.update = function () {
        var forward_starting_options = _(available).filter({
          'contract_category_display': state.categories.value,
          'contract_display': state.category_displays.selected,
          'start_type': 'forward'
        }).head();
        // For markets with spot start_type
        var spot_starting_options = _(available).filter({
          'contract_category_display': state.categories.value,
          'contract_display': state.category_displays.selected,
          'start_type': 'spot'
        }).head();

        if (!forward_starting_options) {
          _.assign(state.date_start, { visible: false, array: [], value: 'now' });
          return;
        };

        forward_starting_options = forward_starting_options.forward_starting_options
        var model = state.date_start;
        var array = [];
        // Add 'NOW' to start time only if the market contains spot start_type.
        if(spot_starting_options){
          array = [{ text: 'Now', value: 'now' }];
        }
        var later = (new Date().getTime() + 5*60*1000)/1000; // 5 minute from now
        _.each(forward_starting_options, function (row) {
          var step = 5 * 60; // 5 minutes step
          var from = Math.ceil(Math.max(later, row.open) / step) * step;
          for (var epoch = from; epoch < row.close; epoch += step) {
            var d = new Date(epoch * 1000);
            var text = ("00" + d.getUTCHours()).slice(-2) + ":" +
            ("00" + d.getUTCMinutes()).slice(-2) + ' ' +
            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
            array.push({ text: text, value: epoch });
          }
        });
        var options = { value: array[0].value, array: array, visible: true };
        if(_.some(array, {value: state.date_start.value*1})) {
          options.value = state.date_start.value;
        }
        _.assign(state.date_start, options);
      };

      state.date_expiry.update = function (date_or_hour) {
        var expiry = state.date_expiry;
        /* contracts that are more not today must end at the market close time */
        var is_today = !moment.utc(expiry.value_date).isAfter(moment.utc(),'day');
        if(!is_today){
            expiry.today_times.disabled = true;
            trading_times_for(expiry.value_date, state.proposal.symbol)
              .then(function(times){
                var value_hour = times.close !== '--' ? times.close : '00:00:00';
                expiry.value_hour = moment(value_hour, "HH:mm:ss").format('HH:mm');
                expiry.value = moment.utc(expiry.value_date + " " + value_hour).unix();
                debounce(expiry.value, state.proposal.onchange);
              });
        }
        else {
            if(date_or_hour !== expiry.value_hour) { expiry.update_times(); }
            expiry.value = moment.utc(expiry.value_date + " " + expiry.value_hour).unix();
            debounce(expiry.value, state.proposal.onchange);
        }
      }

      state.duration.update = function () {
        var category = state.categories.value;
        if (_(["Up/Down", "In/Out", "Touch/No Touch"]).includes(category)) {
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
          'contract_category_display': state.categories.value,
          'contract_display': state.category_displays.selected,
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
          var subcat = state.category_displays.selected;
          if(state.categories.value !== 'Digits' || subcat === 'odd' || subcat === 'even') {
            state.digits.visible = false;
            return;
          }

          var array = {
            matches: ['0', '1','2','3','4','5','6','7','8', '9'],
            differs: ['0', '1','2','3','4','5','6','7','8', '9'],
            under: ['1','2','3','4','5','6','7','8', '9'],
            over: ['0','1','2','3','4','5','6','7','8'],
          }[subcat];
          var text = {
            matches: 'Last Digit Prediction'.i18n(),
            differs: 'Last Digit Prediction'.i18n(),
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
          'contract_category_display': state.categories.value,
          'contract_display': state.category_displays.selected,
          'expiry_type':expiry_type
        }).filter(function (r) { return r.barriers >= 1; }).head();

        state.barriers.barrier_count = barriers ? barriers.barriers : 0;
        if (!barriers)
          return;

        if(barriers.barrier) {
          var barrier = (state.barriers.barrier || barriers.barrier) * 1;
          state.barriers.barrier = (barrier >= 0 ? '+' : '') + barrier;
        }
        if(barriers.high_barrier){
          var high_barrier = (state.barriers.high_barrier || barriers.high_barrier) * 1;
          state.barriers.high_barrier = (high_barrier >= 0 ? '+' : '') + high_barrier;
        }
        if(barriers.low_barrier){
          var low_barrier = (state.barriers.low_barrier || barriers.low_barrier) * 1;
          state.barriers.low_barrier = (low_barrier >= 0 ? '-' : '') + low_barrier;
        }
      };

      state.basis.update_limit = function () {
        var basis = state.basis;
        var limit = _(available).filter({
          'contract_category_display': state.categories.value,
          'contract_display': state.category_displays.selected
        }).head();

        limit = (limit && limit.payout_limit) || null;
        basis.limit = limit ? (limit * 1) : null;
        if(basis.limit) {
          basis.amount = Math.min(basis.amount, basis.limit);
        }
      };

      state.proposal.onchange = function () {
        var unit = state.duration_unit.value;
        var expiry_type = _(['seconds', 'minutes', 'hours']).includes(unit) ? 'intraday' : unit === 'days' ? 'daily' : 'tick';
        if(state.categories.value === 'Spreads') expiry_type = 'intraday';
        var row = _(available).filter({
          'contract_category_display': state.categories.value,
          'contract_display': state.category_displays.selected,
          'expiry_type': expiry_type
        }).head();
        var request = {
          proposal: 1,
          subscribe: 1,
          contract_type: row.contract_type,
          currency: state.currency.value, /* This can only be the account-holder's currency */
          symbol: state.proposal.symbol, /* Symbol code */
        };
        if(state.categories.value !== 'Spreads') {
          request.amount = state.basis.amount*1; /* Proposed payout or stake value */
          request.basis = state.basis.value; /* Indicate whether amount is 'payout' or 'stake */
        } else {
          request.amount_per_point = state.spreads.amount_per_point;
          request.stop_type = state.spreads.stop_type;
          request.stop_loss = state.spreads.stop_loss;
          request.stop_profit = state.spreads.stop_profit;
        }
        /* set the value for barrier(s) */
        if (state.barriers.barrier_count == 1) {
          request.barrier = state.barriers.barrier;
        }
        if (state.barriers.barrier_count == 2) {
          request.barrier = state.barriers.high_barrier;
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
          request.duration_unit = _(state.duration_unit.value).head(); //  (d|h|m|s|t), Duration unit is s(seconds), m(minutes), h(hours), d(days), t(ticks)
          if(state.duration_count.value < 1) {
            state.duration_count.value = 1;
            return;
          }
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

        var new_proposal_promise = liveapi.send(request)
          .then(function (data) {
            /* OK, this is the last sent request */
            if(new_proposal_promise === state.proposal.last_promise) {
              var id = data.proposal && data.proposal.id;
              state.proposal.error = '';
              state.proposal.id = id;
            }
            return data;
          })
          .catch(function (err) {
            console.error(err);
            state.proposal.error = err.message;
            state.proposal.message = '';
            if (err.echo_req && err.echo_req.proposal && err.details) {
              state.proposal.ask_price = err.details.display_value;
              state.proposal.message = err.details.longcode;
            }
            return err;
          });
        /* update last_promise to invalidate previous requests */
        state.proposal.last_promise = new_proposal_promise;
        state.proposal.id = ''; /* invalidate last proposal.id */
      };

      state.purchase.onclick = function() {
        state.purchase.loading = true;
        var show = function(div){
          div.appendTo(root);

          root.find('.trade-fields').css({ left : '350px'});
          root.find('.trade-conf').css({ left : '0'});
          // root.find('.trade-fields').animate({ left : '+=350'}, 1000, 'linear');
          // root.find('.trade-conf').animate({ left : '+=350'}, 1000, 'linear');
        };
        var hide = function(div){
          root.find('.trade-fields').css({ left : '0'});
          root.find('.trade-conf').css({ left : '-350px'});
          // root.find('.trade-fields').animate({ left : '-=350'}, 500, 'linear');
          // root.find('.trade-conf').animate({ left : '-=350'}, 500, 'linear', function(){ ... });
          state.purchase.loading = false;
          div.remove();
          /* trigger a new proposal stream */
          state.proposal.onchange();
        }

        /* workaround for api not providing this fields */
        var extra = {
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
        if(_(['Digits','Up/Down','Asians']).includes(extra.category) && state.duration.value === 'Duration' && extra.duration_unit === 'ticks') {
            extra.digits_value = state.digits.value;
            extra.tick_count = state.duration_count.value*1;
            if(extra.category !== 'Digits') {
              if (extra.category !== 'Asians') {
                extra.tick_count += 1; /* we are shwoing X ticks arfter the initial tick so the total will be X+1 */
              }
              /* for higher/lower final barrier value is entry_quote + barrrier */
              if(extra.category === 'Up/Down' && _(['higher','lower']).includes(extra.category_display)) {
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
        }
        else {
          require(['trade/tradeConf'], function(tradeConf) {
            liveapi.send({
                  buy: state.proposal.id,
                  price: state.proposal.ask_price * 1,
               })
               .then(function(data){
                    extra.contract_id = data.buy.contract_id;
                    extra.transaction_id = data.buy.transaction_id;
                    if(extra.show_tick_chart || extra.category === 'Digits') {
                      liveapi.proposal_open_contract.subscribe(extra.contract_id);
                    }
                    tradeConf.init(data, extra, show, hide, symbol);
               })
               .catch(function(err){
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
               });
          });
         }
      };

      state.categories.array = _(available).map('contract_category_display').uniq().value();
      state.categories.value = _(state.categories.array).includes('Up/Down') ? 'Up/Down' : _(state.categories.array).head(); // TODO: show first tab

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
              if(state.ticks.array.length > 30) {
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

      /* change currency on user login */
      if(liveapi.is_authenticated()) {
        liveapi.send({payout_currencies: 1})
               .then(function(data){
                 state.currency.value = data.payout_currencies[0];
                 state.currency.array = data.payout_currencies;
               })
               .catch(function(err) { console.error(err); });
      }

      return state;
    }

    function init(symbol, contracts_for) {
        var root = $(html).i18n();
        var available = apply_fixes(contracts_for.available);


        var dialog = windows.createBlankWindow(root, {
            title: symbol.display_name,
            resizable: false,
            collapsable: false,
            minimizable: true,
            maximizable: false,
            'data-authorized': 'true',
            close: function() {
              /* forget last proposal stream on close */
              if(state.proposal.last_promise) {
                state.proposal.last_promise.then(function(data){
                  var id = data.proposal && data.proposal.id;
                  id && liveapi.send({forget: id});
                });
              }
              chartingRequestMap.unregister(key);
              view.unbind();
              dialog.destroy();
            }
        });
        dialog.track({
          module_id: 'tradeDialog',
          is_unique: false,
          data: symbol
        });

        /********************** register for ticks_streams **********************/
        var key = chartingRequestMap.keyFor(symbol.symbol, /* granularity = */ 0);
        var has_digits = _(available).map('min_contract_duration')
                          .some(function(duration){ return /^\d+$/.test(duration) || (_.last(duration) === 't'); });
        if(!chartingRequestMap[key]){ /* don't register if already someone else has registered for this symbol */
            chartingRequestMap.register({
              symbol: symbol.symbol,
              subscribe: 1,
              granularity: 0,
              count: 1000, /* this will be for the case that the user opens a the same tick chart later */
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
        var view = rv.bind(root[0],state)
        state.categories.update();            // trigger update to init categories_display submenu

        dialog.dialog('open');
        // window.state = state; window.av = available; window.moment = moment; window.dialog = dialog; window.times_for = trading_times_for;
    }

    return {
        init: init
    };
});
