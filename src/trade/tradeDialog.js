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

define(['lodash', 'jquery', 'windows/windows', 'common/rivetsExtra', 'websockets/binary_websockets', 'text!trade/tradeDialog.html', 'css!trade/tradeDialog.css', 'timepicker', 'jquery-ui'],
    function (_, $, windows, rv, liveapi, html) {
    require(['trade/tradeConf']); /* trigger async loading of trade Confirmation */
    var replacer = function (field_name, value) { return function (obj) { obj[field_name] = value; return obj; }; };

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
        /* Digits odd/even/over/under are not yet implemented in beta trading interface ignore them for now, TODO: implement them */
        available = _(available).reject(function (r) { return _(['odd', 'even', 'over', 'under']).contains(r.contract_display); }).run();
        /* Spreads are not yet implemented, ignore them for now, TODO: itempement Spreads */
        available = _(available).reject('contract_category_display', 'Spreads').run();
        return available;
    }

    function init_state(available,root){

      var state = {
        duration: {
          array: ['Duration', 'End Time'],
          value: 'Duration',
        },
        duration_unit: {
          array: [{ type: '', min: 1, max:365 }],
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
            var paddings = { "Asians" : '17px', "Up/Down" : '12px', "Digits" : '12px', "In/Out" : '1px', "Touch/No Touch" : '12px' };
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
          value: '0',
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
        tick: {
          epoch: '0',
          quote:'0'
        },
        proposal: {
          symbol: available.first().underlying_symbol,
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
        }
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
            min: r.min_contract_duration,
            max: r.max_contract_duration,
            type: r.expiry_type
          }
        }).run();

        var array = [];
        _.each(durations, function (d) {
          if (_(['tick', 'daily']).contains(d.type)) {
            array.push({
              min: (d.min + '').replace('d', '') | 0,
              max: (d.max + '').replace('d', '') | 0,
              type: { tick: 'ticks', daily: 'days' }[d.type]
            });
            return;
          }
          /* fix intraday duration intervals */
          var min = d.min.replace('s', '').replace('m', ''),
              max = d.max.replace('s', '').replace('m', '').replace('d', '');
          var min_unit = _(d.min).last(),
              max_unit = _(d.max).last();

          min *= { 's': 1, 'm': 60 }[min_unit];                 // convert to seconds
          max *= { 's': 1, 'm': 60, 'd': 3600 * 24 }[max_unit];

          if('s' === min_unit) {
            array.push({ min: min, max: max, type: 'seconds' });
          }
          if(_(['s', 'm']).contains(min_unit) && max >= 60) {
            array.push({ min: Math.max(min / 60, 1), max: max / 60, type: 'minutes' });
          }
          if(_(['s', 'm']).contains(min_unit) && max >= 3600) {
            array.push({ min: Math.max(min / 3600, 1), max: max / 3600, type: 'hours' });
          }
        });

        array.sort(function (r1, r2) {
          var dict = { 'ticks': 0, 'seconds': 1, 'minutes': 2, 'hours': 3, 'days': 4 };
          return dict[r1.type] - dict[r2.type];
        });

        if (!array.length) {
          state.barriers.update();
          return;
        }

        state.duration_unit.array = array;
        if (!_(array).map('type').contains(state.duration_unit.value)) {
          state.duration_unit.value = _(array).first().type;
        }
        else { /* manualy notify 'duration_count' and 'barriers' to update themselves */
          state.duration_count.update();
          state.barriers.update();
        }
      };

      state.duration_count.update = function () {
        var range = _(state.duration_unit.array).filter('type', state.duration_unit.value).first();
        if (!range) return;
        state.duration_count.min = range.min;
        state.duration_count.max = range.max;
        var value = state.duration_count.value;
        state.duration_count.value = Math.min(Math.max(value, range.min), range.max);
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

        state.barriers.barrier = (barriers.barrier || '+0.00000') * 1;
        state.barriers.high_barrier = '' + (barriers.high_barrier || '+0.00000') * 1;
        state.barriers.low_barrier = '' + (barriers.low_barrier || '-0.00000') * 1;
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
        var row = _(available).filter({
          'contract_category_display': state.categories.value,
          'contract_display': state.category_displays.selected,
          'expiry_type': expiry_type
        }).first();
        var request = {
          proposal: 1,
          amount: state.basis.amount, /* Proposed payout or stake value */
          basis: state.basis.value, /* Indicate whether amount is 'payout' or 'stake */
          contract_type: row.contract_type,
          currency: state.currency.value, /* This can only be the account-holder's currency */
          symbol: state.proposal.symbol, /* Symbol code */
        };
        /* set the value for barrier(s) */
        if (state.barriers.barrier_count == 1) {
          request.barrier = '+' + state.barriers.barrier;
        }
        if (state.barriers.barrier_count == 2) {
          request.barrier = '+' + state.barriers.high_barrier;
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
          state.proposal.loading = false;
        })
        .catch(function (err) {
          console.error(err);
          state.proposal.error = err.message;
        });
      };

      state.purchase.onclick = function() {
        state.purchase.loading = true;
        var show = function(div){
          div.appendTo(root);

          root.find('.trade-fields').animate({ left : '+=350'}, 1000, 'linear');
          root.find('.trade-conf').animate({ left : '+=350'}, 1000, 'linear');
        };

        /* workaround for api not providing this fields */
        var passthrough = {
            payout_amount: state.basis.amount,
            currency: state.currency.value,
            symbol: state.proposal.symbol,
            category: state.categories.value,
        };
        /* pass data which is needed to show live tick purchase results */
        if(passthrough.category === 'Digits' && state.duration_unit.value === 'ticks'){
          passthrough.digits_value = state.digits.value;
          passthrough.digits_count = state.duration_count.value;
        }

        // TODO: manually check to see if the user is authenticated or not, we should update state.currency from user profile (not everyone is using USD)!
        liveapi.send({
                buy: _(state.proposal.ids).last(),
                price: state.proposal.ask_price,
                passthrough: passthrough
             })
             .then(function(data){
                console.warn(data);
                require(['trade/tradeConf'], function(tradeConf){
                    tradeConf.init(data, show);
                });
             })
             .catch(function(err){
               state.purchase.loading = false;
               $.growl.error({ message: err.message });
               console.error(err);
             });
      };
      state.categories.array = _(available).map('contract_category_display').uniq().run();
      state.categories.value = _(state.categories).contains('Digits') ? 'Digits' : _(state.categories.array).first(); // TODO: show first tab

      /* register for this symbol, TODO: don't register if already someone else has registered for this symbol */
      liveapi.send({ ticks: state.proposal.symbol }).catch(function (err) { console.error(err); });
      /* register for tick stream of the corresponding symbol */
      liveapi.events.on('tick', function (data) {
          if (data.tick && data.tick.symbol == state.proposal.symbol) {
              if(state.purchase.loading) return; /* don't update ui while loading confirmation dialog */
              state.tick.epoch = data.tick.epoch;
              state.tick.quote = data.tick.quote;
          }
      });
      /* register for proposal event */
      liveapi.events.on('proposal', function (data) {
          if (data.echo_req.symbol !== state.proposal.symbol) return; /* TODO: fix this for multiple dialogs with the same symbol */
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
      });

      return state;
    }

    function init(symbol, contracts_for) {
        var root = $(html);
        var available = apply_fixes(contracts_for.available);
        var state = init_state(available,root);

        /* TODO: development only! */
        window.state = state; window.available = available; window.root = root;

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

        dialog.dialog('open');
        // setTimeout(state.purchase.onclick.bind(state.purchase), 4000); // TODO: remove this
    }

    return {
        init: init
    };
});
