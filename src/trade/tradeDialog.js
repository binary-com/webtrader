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

define(['lodash', 'jquery', 'windows/windows', 'common/rivetsExtra', 'websockets/binary_websockets', 'charts/chartingRequestMap', 'text!trade/tradeDialog.html', 'css!trade/tradeDialog.css', 'jquery-sparkline', 'timepicker', 'jquery-ui'],
    function (_, $, windows, rv, liveapi, chartingRequestMap, html) {
    require(['trade/tradeConf']); /* trigger async loading of trade Confirmation */
    var replacer = function (field_name, value) { return function (obj) { obj[field_name] = value; return obj; }; };

    rv.binders['trade-dialog-sparkline'] = function(el, ticks) {
      var chart = $(el);
      var spots = _.map(ticks,'quote');
      var config = {
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
      setTimeout(function(){
        chart.sparkline(spots, config);
        spots.length ? chart.show() : chart.hide();
      },0);
    }

    function apply_fixes(available){
        /* fix for server side api, not seperating higher/lower frim rise/fall in up/down category */

        _(available).filter({
          'contract_category_display': 'Up/Down',
          'barrier_category' : 'euro_atm',
          'contract_display' : 'higher'
        }).each(replacer('contract_display', 'rise')).run();

        _(available).filter({
          'contract_category_display':'Up/Down',
          'barrier_category': 'euro_atm',
          'contract_display': 'lower',
        }).each(replacer('contract_display','fall')).run();
        /* fix for server side api, returning two different contract_category_displays for In/Out */
        _(available).filter('contract_category_display', 'Stays In/Goes Out')
                    .each(replacer('contract_category_display', 'In/Out')).run();
        _(available).filter('contract_category_display', 'Ends In/Out')
                    .each(replacer('contract_category_display', 'In/Out')).run();
        /* fix for websocket having a useless barrier value for digits */
        _(available).filter('contract_category_display', 'Digits')
                    .each(replacer('barriers', 0)).run();
        /* fix for contract_display text in In/Out menue */
        _(available).filter('contract_display', 'ends outside').each(replacer('contract_display', 'ends out')).run();
        _(available).filter('contract_display', 'ends between').each(replacer('contract_display', 'ends in')).run();
        _(available).filter('contract_display', 'stays between').each(replacer('contract_display', 'stays in')).run();
        _(available).filter('contract_display', 'goes outside').each(replacer('contract_display', 'goes out')).run();
        _(available).filter('contract_display', 'touches').each(replacer('contract_display', 'touch')).run();
        _(available).filter('contract_display', 'does not touch').each(replacer('contract_display', 'no touch')).run();

        /* put 'odd' & 'even' to the end of list */
        var put_to_end = function(array, condition){
          var inx = _(array).findIndex(condition);
          if(inx !== -1) array.push(array.splice(inx,1)[0]);
        }
        put_to_end(available, {'contract_display': 'odd'});
        put_to_end(available, {'contract_display': 'even'});

        return available;
    }

    function init_state(available,root){

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
          value_date: new Date().toISOString().split('T')[0], /* today utc in yyyy-mm-dd format */
          value_hour: new Date().toISOString().split('T')[1].slice(0,5), /* now utc in hh:mm format */
          value: 0,    /* epoch value of date+hour */
        },
        categories: {
          array: [],
          value: '',
          paddingTop: function(){
            var paddings = { "Asians" : '19px', "Up/Down" : '12px', "Digits" : '14px', "In/Out" : '2px', "Touch/No Touch" : '16px' , "Spreads":'5px' };
            return paddings[state.categories.value] || '3px';
          }
        },
        category_displays: {
          array: [],
          selected: ''
        },
        barriers: {
          barrier_count: 0,
          barrier : '+0.00000',
          high_barrier: '+0.00000',
          low_barrier: '-0.00000',
          barrier_live: function() { return this.barrier * 1 + state.tick.quote * 1; },
          high_barrier_live: function() { return this.high_barrier * 1 + state.tick.quote * 1; },
          low_barrier_live: function() { return this.low_barrier * 1 + state.tick.quote * 1; },
        },
        digits: {
          array: ['0', '1','2','3','4','5','6','7','8','9'],
          value: '0',
          visible: false,
          text: 'Last Digit Prediction'
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
          stop_loss: 10,
          stop_profit: 10,
          /* updated from #proposal websocket api */
          spread: 0.0,
          spot: '0.0',
          spot_time: '0',
          deposit_: function(){
            return this.stop_loss * this.amount_per_point;
          }
        },
        tick: {
          epoch: '0',
          quote:'0'
        },
        ticks: {
          array: [], /* ticks for sparkline chart */
        },
        proposal: {
          symbol: _(available).first().underlying_symbol,
          ids: [], /* Id of proposal stream, Must have only one stream, however use an array to handle multiple requested streams. */

          ask_price: "0.0",
          date_start: 0,
          display_value: "0.0",
          message: 'Loading ...', /* longcode */
          payout: 0,
          spot: "0.0",
          spot_time: "0",
          error: '',
          loading: true, /* the proposal request state */

          /* computed properties */
          netprofit_: function () {
            return state.currency.value + ' ' + ((this.payout - this.ask_price) || 0).toFixed(2);
          },
          return_: function () {
            var ret = (((this.payout - this.ask_price) / this.ask_price) || 0).toFixed(2) ;
            return (ret* 100 | 0) + '%';
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

      state.categories.update = function () {
        var name = state.categories.value;
        state.category_displays.array = _(available).filter('contract_category_display', name).map('contract_display').uniq().run();
        state.category_displays.selected = _.first(state.category_displays.array);
      };

      state.category_displays.onclick = function (e) {
        state.category_displays.selected = $(e.target).attr('data');
      };

      state.date_start.update = function () {
        var forward_starting_options = _(available).filter({
          'contract_category_display': state.categories.value,
          'contract_display': state.category_displays.selected,
          'start_type': 'forward'
        }).first();

        if (!forward_starting_options) {
          _.assign(state.date_start, { visible: false, array: [], value: 'now' });
          return;
        };

        forward_starting_options = forward_starting_options.forward_starting_options
        var model = state.date_start;
        var array = [{ text: 'Now', value: 'now' }];
        _.each(forward_starting_options, function (row) {
          var step = 5 * 60; // 5 minutes step
          var from = Math.ceil(Math.max(new Date().getTime() / 1000, row.open) / step) * step;
          to = row.close;
          for (var epoch = from; epoch < to; epoch += step) {
            var d = new Date(epoch * 1000);
            var text = ("00" + d.getUTCHours()).slice(-2) + ":" +
            ("00" + d.getUTCMinutes()).slice(-2) + ' ' +
            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
            array.push({ text: text, value: epoch });
          }
        });
        _.assign(state.date_start, { value: 'now', array: array, visible: true });
      };

      state.date_expiry.update = function () {
        var yyyy_mm_dd = state.date_expiry.value_date,
        hh_mm = state.date_expiry.value_hour;
        var ymd = yyyy_mm_dd.split('-'),
        hm = hh_mm.split(':'),
        year = ymd[0] * 1,
        month = ymd[1] * 1 - 1,
        day = ymd[2] * 1,
        hour = hm[0] * 1,
        minute = hm[1] * 1;
        state.date_expiry.value = Date.UTC(year, month, day, hour, minute) / 1000;
      }

      state.duration.update = function () {
        var category = state.categories.value;
        if (_(["Up/Down", "In/Out", "Touch/No Touch"]).contains(category)) {
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
        }).run();

        var array = [];
        var ranges = [];
        _.each(durations, function (d) {
          if (_(['tick', 'daily']).contains(d.type)) {
            array.push({ tick: 'ticks', daily: 'days' }[d.type]);
            ranges.push({
              min: d.min.replace('d', '') | 0,
              max: d.max.replace('d', '') | 0,
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
          if(_(['s', 'm']).contains(min_unit) && max >= 60) {
            array.push('minutes');
            ranges.push({ min: Math.max(min / 60, 1), max: max / 60, type: 'minutes' });
          }
          if(_(['s', 'm', 'h']).contains(min_unit) && max >= 3600) {
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
        state.duration_unit.array = array;
        state.duration_unit.value = _.first(array);

        /* manualy notify 'duration_count' and 'barriers' to update themselves */
        state.duration_count.update();
        state.barriers.update();
      };

      state.duration_count.update = function () {
        var range = _(state.duration_unit.ranges).filter({'type': state.duration_unit.value}).first();
        if (!range) return;
        state.duration_count.min = range.min;
        state.duration_count.max = range.max;
        var value = state.duration_count.value;
        state.duration_count.value = Math.min(Math.max(value, range.min), range.max);
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
            matches: 'Last Digit Prediction',
            differs: 'Last Digit Prediction',
            under: 'Last Digit is Under',
            over: 'Last Digit is Over'
          }[subcat];

          state.digits.array = array;
          state.digits.value = array[0];
          state.digits.text = text;
          state.digits.visible = true;
      };

      state.barriers.update = function () {
        var unit = state.duration_unit.value;
        var expiry_type = _(['seconds', 'minutes', 'hours']).contains(unit) ? 'intraday' : unit === 'days' ? 'daily' : 'tick';
        var barriers = _(available).filter({
          'contract_category_display': state.categories.value,
          'contract_display': state.category_displays.selected,
          'expiry_type':expiry_type
        }).filter(function (r) { return r.barriers >= 1; }).first();

        state.barriers.barrier_count = barriers ? barriers.barriers : 0;
        if (!barriers)
          return;

        state.barriers.barrier = '+' + (barriers.barrier || '+0.00000') * 1;
        state.barriers.high_barrier = '+' + (barriers.high_barrier || '+0.00000') * 1;
        state.barriers.low_barrier = (barriers.low_barrier || '-0.00000') * 1;
      };

      state.basis.update_limit = function () {
        var basis = state.basis;
        var limit = _(available).filter({
          'contract_category_display': state.categories.value,
          'contract_display': state.category_displays.selected
        }).first();

        limit = (limit && limit.payout_limit) || null;
        basis.limit = limit ? (limit * 1) : null;
        if(basis.limit) {
          basis.amount = Math.min(basis.amount, basis.limit);
        }
      };

      state.proposal.onchange = function () {
        var unit = state.duration_unit.value;
        var expiry_type = _(['seconds', 'minutes', 'hours']).contains(unit) ? 'intraday' : unit === 'days' ? 'daily' : 'tick';
        if(state.categories.value === 'Spreads') expiry_type = 'intraday';
        var row = _(available).filter({
          'contract_category_display': state.categories.value,
          'contract_display': state.category_displays.selected,
          'expiry_type': expiry_type
        }).first();
        var request = {
          proposal: 1,
          contract_type: row.contract_type,
          currency: state.currency.value, /* This can only be the account-holder's currency */
          symbol: state.proposal.symbol, /* Symbol code */
        };
        if(state.categories.value !== 'Spreads') {
          request.amount = state.basis.amount; /* Proposed payout or stake value */
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
          request.duration_unit = _(state.duration_unit.value).first(); //  (d|h|m|s|t), Duration unit is s(seconds), m(minutes), h(hours), d(days), t(ticks)
          request.duration = state.duration_count.value * 1;
        }
        else {
          request.date_expiry = state.date_expiry.value;
        }

        state.proposal.loading = true;
        /* forget requested streams */
        while (state.proposal.ids.length) {
          var id = state.proposal.ids.shift();
          liveapi.send({ forget: id });
        }

        liveapi.send(request)
        .then(function (data) {
          var id = data.proposal.id;
          state.proposal.ids.push(id);
          state.proposal.error = '';
        })
        .catch(function (err) {
          console.error(err);
          state.proposal.error = err.message;
          state.proposal.message = '';
        });
      };

      state.purchase.onclick = function() {
        state.purchase.loading = true;
        var show = function(div){
          div.appendTo(root);

          root.find('.trade-fields').animate({ left : '+=350'}, 1000, 'linear');
          root.find('.trade-conf').animate({ left : '+=350'}, 1000, 'linear');
        };
        var hide = function(div){
          root.find('.trade-fields').animate({ left : '-=350'}, 500, 'linear');
          root.find('.trade-conf').animate({ left : '-=350'}, 500, 'linear', function(){
            state.purchase.loading = false;
            div.remove();
          });
          /* trigger a new proposal stream */
          state.proposal.onchange();
        }

        /* workaround for api not providing this fields */
        var passthrough = {
            currency: state.currency.value,
            symbol: state.proposal.symbol,
            category: state.categories.value,
            category_display: state.category_displays.selected,
            duration_unit: state.duration_unit.value,
        };
        /* pass data which is needed to show live tick purchase results */
        if(_(['Digits','Up/Down']).contains(passthrough.category) && passthrough.duration_unit === 'ticks') {
            passthrough.digits_value = state.digits.value;
            passthrough.tick_count = state.duration_count.value*1;
            passthrough.tick_count += passthrough.category == 'Up/Down' ? 1 : 0; /* Up/Down trades need one extra tick for entry spot */
        }

        // manually check to see if the user is authenticated or not,
        // we should update state.currency from user profile first (not everyone is using USD)
        if(!liveapi.is_authenticated()) {
            $.growl.warning({ message: 'Please login with real account in order to Purchase' });
            state.purchase.loading = false;
        }
        else {
            liveapi.send({
                  buy: _(state.proposal.ids).last(),
                  price: state.proposal.ask_price,
                  passthrough: passthrough
               })
               .then(function(data){
                  require(['trade/tradeConf'], function(tradeConf){
                      tradeConf.init(data, show, hide);
                  });
               })
               .catch(function(err){
                 state.purchase.loading = false;
                 $.growl.error({ message: err.message });
                 console.error(err);
               });
         }
      };

      state.categories.array = _(available).map('contract_category_display').uniq().run();
      state.categories.value = _(state.categories.array).contains('Up/Down') ? 'Up/Down' : _(state.categories.array).first(); // TODO: show first tab

      var key = chartingRequestMap.keyFor(state.proposal.symbol, 0);
      if(!chartingRequestMap[key]){ /* don't register if already someone else has registered for this symbol */
          chartingRequestMap.register({
            symbol: state.proposal.symbol,
            subscribe: 1,
            granularity: 0,
            count: 1,
            style: 'ticks'
          }).catch(function (err) { console.error(err); });
      }
      /* register for tick stream of the corresponding symbol */
      liveapi.events.on('tick', function (data) {
          if (data.tick && data.tick.symbol == state.proposal.symbol) {
              // if(state.purchase.loading) return; /* don't update ui while loading confirmation dialog */
              state.tick.epoch = data.tick.epoch;
              state.tick.quote = data.tick.quote;
              /* update ticks for sparkline chart */
              if(state.ticks.array.length > 30) {
                state.ticks.array.shift();
              }
              state.ticks.array.push(data.tick);
          }
      });
      /* register for proposal event */
      liveapi.events.on('proposal', function (data) {
          var proposal_id = _.last(state.proposal.ids);
          if (data.proposal.id !== proposal_id) return;
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
      });

      /* change currency on user login */
      liveapi.events.on('login', function(data){
          state.currency.array = [data.authorize.currency];
          state.currency.value = state.currency.value;
      });

      return state;
    }

    function init(symbol, contracts_for) {
        var root = $(html);
        var available = apply_fixes(contracts_for.available);
        var state = init_state(available,root);

        var dialog = windows.createBlankWindow(root, {
            title: symbol.display_name,
            resizable: false,
            collapsable: true,
            minimizable: true,
            maximizable: false,
            /* forget proposal streams on close,
              TODO: figure out if/when we should close tick stream */
            close: function() {
              while (state.proposal.ids.length) {
                var id = state.proposal.ids.shift();
                liveapi.send({ forget: id });
              }
            }
        });

        var view = rv.bind(root[0],state)
        state.categories.update();            // trigger update to init categories_display submenu
        window.state = state; // TODO: remove this
        window.ava = available;

        dialog.dialog('open');
    }

    return {
        init: init
    };
});
