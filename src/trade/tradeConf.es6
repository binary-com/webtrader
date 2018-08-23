import $ from 'jquery';
import moment from 'moment';
import liveapi from '../websockets/binary_websockets';
import rv from '../common/rivetsExtra';
import chartingRequestMap from '../charts/chartingRequestMap';
import html from 'text!../trade/tradeConf.html';
import 'css!../trade/tradeConf.css';
import Lookback from './lookback';
import '../common/util';

/* rv binder to show tick chart for this confirmation dialog */
let display_decimals;
rv.binders['tick-chart'] = {
   priority: 65, /* a low priority to apply last */
   bind: function(el) {
      const model = this.model;
      el.chart = new Highcharts.Chart({
         title: '',
         credits: {enabled: false},
         chart: {
            type: 'line',
            renderTo: el,
            backgroundColor: null, /* make background transparent */
            width: (el.getAttribute('width') || 400)*1,
            height: (el.getAttribute('height') || 120)*1,
            marginLeft: 20,
         },
         tooltip: {
            formatter: function () {
               const tick = model.array[this.x-1];
               return (tick && tick.tooltip) || false;
            }
         },
         xAxis: {
            type: 'linear',
            min: 1,
            max: el.getAttribute('tick-count')*1 + 1 /* exist spot vertical plot will not be at the end */,
            labels: { enabled: false, }
         },
         yAxis: {
            labels: {
                  align: 'left',
                  x: 0,
                  formatter() {
                        return addComma(this.value.toFixed(display_decimals));
                  },
            },
            title: '',
            gridLineWidth: 0,
         },
         series: [
            { data: [] },
            /* HighChart scales the y-axis automatically based on the maximum value of data.
             * but it doesn't consider the plotLine's value in its calculations.
             * We add an invisible seri and late plotline values to work around this issue. */
            {
               type: 'scatter',
               marker: { enabled: false },
               data: []
            }
         ],
         plotOptions: { scatter: { enableMouseTracking: false } },
         exporting: {enabled: false, enableImages: false},
         legend: {enabled: false},
      });
   },
   routine: function(el, ticks){
      // Handles updating chart: state.ticks.array updates => routine fires
      const model = this.model;
      const tick_idx = ticks.length;
      const barrier = model.make_barrier();
      const { contract_is_finished } = model;

      if (barrier) {
            draw_barrier(barrier);
      }

      if (contract_is_finished) {
            draw_exit_spot(model, ticks);
            return;
      }

      if (tick_idx === 0) return;

      draw_tick(tick_idx);

      if (tick_idx === 1) {
            draw_entry_spot(tick_idx);
      }

      function draw_exit_spot(model, ticks) {
            const is_path_dependent_contract = !!model.is_path_dependent;
            let exit_tick_idx = ticks.findIndex((tick) => {
                  if (is_path_dependent_contract) {
                        return tick.epoch === (+model.sell_spot_time);
                  }
                  return tick.epoch === (+model.exit_tick_time);
            });
            const exit_spot = model.make_exit_spot(exit_tick_idx + 1);
            draw_x_line(el.chart, exit_spot);
      };

      function draw_tick(tick_idx) {
            const tick = ticks[tick_idx -1];
            el.chart.series[0].addPoint([tick_idx, tick.quote]);
      };

      function draw_entry_spot(tick_idx) {
            const is_label_left = true;
            const entry_spot = model.make_entry_spot(tick_idx);
            draw_x_line(el.chart, entry_spot, is_label_left);
      };

      function draw_barrier(barrier) {
            el.chart.yAxis[0].removePlotLine(barrier.id);
            draw_y_line(el.chart, barrier);
      };

      function draw_x_line(chart, options, align_label_left) {
            const label_x_position = align_label_left ? -15 : 5;
   
            chart.xAxis[0].addPlotLine({
               value: options.value,
               id: options.id || options.value,
               label: {text: options.label || 'label', x:  label_x_position },
               color: options.color || '#e98024',
               width: options.width || 2,
               dashStyle: options.dashStyle || false,
            });
      };

      function draw_y_line(chart,options) {
            chart.yAxis[0].addPlotLine({
               id: options.id || options.label,
               value: options.value,
               label: {text: options.label, align: 'center'},
               color: 'green',
               width: 2,
            });
            /* Add plotline value to invisible seri to make the plotline always visible. */
            chart.series[1].addPoint([1, options.value*1]);
      };
   }
};

const register_ticks = (state, extra) => {
   let proposal_open_contract;
   let on_proposal_open_contract;
   let on_tick;
   let { tick_count } = extra;
   /* No need to worry about WS connection getting closed, because the user will be logged out */
   const add_tick  = (tick) => {
      const is_or_after_contract_entry = (+tick.epoch) >= (+proposal_open_contract.entry_tick_time);
      const is_new_tick = !state.ticks.array.some((state_tick) => state_tick.epoch * 1 === tick.epoch * 1);
      const should_add_new_tick = is_new_tick && !state.ticks.contract_is_finished && is_or_after_contract_entry;

      if (should_add_new_tick) {
            const contract_is_finished = proposal_open_contract.status !== 'open' && !state.ticks.contract_is_finished;
            state.buy.barrier = proposal_open_contract.barrier ? (+proposal_open_contract.barrier) : null;

            if (contract_is_finished) {
                  on_contract_finished(proposal_open_contract);
                  update_chart();
            }
            tick_count--;
            if (tick_count > -1) {
                  add_tick_to_state(tick);
            }
      }
   }

   function add_tick_to_state(tick) {
      const decimal_digits = chartingRequestMap.digits_after_decimal(extra.pip, extra.symbol);
      const tooltip = make_tooltip(tick);

      state.ticks.array.push({
         quote: (+tick.quote),
         epoch: (+tick.epoch),
         number: state.ticks.array.length + 1,
         tooltip,
         decimal_digits,
      });

      function make_tooltip(tick) {
            const tick_time = moment.utc(tick.epoch * 1000).format('dddd, MMM D, HH:mm:ss');
            const { symbol_name } = extra;
            const tick_quote_formatted = (+tick.quote).toFixed(decimal_digits);

            return `${tick_time}<br/>${symbol_name} ${(+tick.quote).toFixed(decimal_digits)}`;
      };
   };

   function update_chart() {
            const tick_arr_copy = state.ticks.array.slice();
            state.ticks.array = [...tick_arr_copy];
    };

   const on_contract_finished = (proposal_open_contract) => {
      forget_stream_and_cb();

      state.ticks.contract_is_finished = true;
      state.ticks.is_path_dependent = proposal_open_contract.is_path_dependent ? proposal_open_contract.is_path_dependent : null;
      state.ticks.exit_tick_time = proposal_open_contract.exit_tick_time ? proposal_open_contract.exit_tick_time : null;
      state.ticks.sell_spot_time = proposal_open_contract.sell_spot_time ? proposal_open_contract.sell_spot_time : null;
      state.ticks.status = proposal_open_contract.status;

      state.buy.update();
      state.back.visible = true;

      function forget_stream_and_cb() {
            const { contract_id } = extra;
            liveapi.events.off('proposal_open_contract', on_proposal_open_contract);
            liveapi.events.off('tick', on_tick);
            liveapi.proposal_open_contract.forget(contract_id);
      };
   };

   on_proposal_open_contract = liveapi.events.on('proposal_open_contract', (data) => {
            const is_different_open_contract_stream = data.proposal_open_contract.contract_id !== extra.contract_id;
            if (is_different_open_contract_stream) return;

            if (data.error) {
                  on_open_proposal_error(data);
                  return;
            }

            ({ proposal_open_contract } = data);
   });
   
  let temp_ticks = [];
  let first_tick_epoch;
  let is_getting_history = false;
  on_tick = liveapi.events.on('tick', (data) => {
      const is_different_stream = extra.symbol !== data.tick.symbol;
      if (is_different_stream) return;
      if (!first_tick_epoch) first_tick_epoch = data.tick.epoch;

      const entry_tick_time = proposal_open_contract && proposal_open_contract.entry_tick_time;
      if (!entry_tick_time) {
            temp_ticks.push(data.tick);
            return;
      }

      const has_missing_ticks = (first_tick_epoch > entry_tick_time);
      if (has_missing_ticks) {
            is_getting_history = true;
            first_tick_epoch = entry_tick_time;
            get_tick_history(entry_tick_time, extra.symbol);
      }

      if (is_getting_history) {
            temp_ticks.push(data.tick);
            return;
      };

      if (temp_ticks.length > 0) {
            temp_ticks.forEach((stored_tick) => add_tick(stored_tick));
            temp_ticks = [];
      }

      add_tick(data.tick);
    });

    function get_tick_history(start, ticks_history) {
      liveapi.send({ ticks_history, end: 'latest', start, style: 'ticks', count: 5000})
            .then((data) => {
                  is_getting_history = false;
                  data.history.prices.forEach((price, idx) => {
                        temp_ticks.push({
                              epoch: data.history.times[idx],
                              quote: price,
                              symbol: extra.symbol,
                        });
                  });
                  temp_ticks.sort((a, b) => (+a.epoch) - (+b.epoch));
            }).catch((err) => $.growl.error({ message: data.error.message }));
    };

   const on_open_proposal_error = (data) => {
      $.growl.error({message: data.error.message});
      liveapi.proposal_open_contract.forget(data.echo_req.contract_id);
      liveapi.proposal_open_contract.subscribe(data.echo_req.contract_id);
   };
};

export const init = (data, extra, show_callback, hide_callback) => {
   display_decimals = data.display_decimals || 3;
   const root = $(html).i18n();
   const { buy } = data;
   const decimal_digits = chartingRequestMap.digits_after_decimal(extra.pip, extra.symbol);
   const state = {
      title: {
         text: 'Contract Confirmation'.i18n(),
      },
      buy: {
         barrier: null,
         message: buy.longcode,
         balance_after: buy.balance_after,
         buy_price: (+buy.buy_price).toFixed(currencyFractionalDigits()),
         purchase_time: buy.purchase_time,
         start_time: buy.start_time,
         transaction_id: buy.transaction_id,
         payout: (+buy.payout).toFixed(currencyFractionalDigits()),
         currency: extra.currency,
         potential_profit : (buy.payout - buy.buy_price).toFixed(currencyFractionalDigits()),
         potential_profit_text : 'Profit'.i18n(),
         show_result: false,
      },
      spreads: {
         amount_per_point: buy.amount_per_point || '0',
         stop_loss_level: buy.stop_loss_level || '0',
         stop_profit_level: buy.stop_profit_level || '0',
      },
      ticks: {
         array: [],
         contract_is_finished: false,
         exit_tick_time: null,
         sell_spot_time: null,
         is_path_dependent: null,
         make_exit_spot: (inx) => ({value: inx, label: 'Exit Spot'.i18n(), dashStyle: 'Dash'}),
         make_entry_spot: (inx) => ({value: inx, label: 'Entry Spot'.i18n()}),
         make_barrier: () => {
            const { barrier } = state.buy;
            if (barrier) {
                  return { value: +barrier, label: 'Barrier ('.i18n() + addComma(barrier.toFixed(display_decimals)) + ')', id: 'plot-barrier-y'};
            }
            return null;
         },
         tick_count: extra.tick_count,
         value: (extra.digits_value || '0') + '', // last digit value selected by the user
         category: extra.category,
         category_display: extra.category_display,

         status: 'waiting', /* could be 'waiting', 'lost' or 'won' */
         chart_visible: extra.show_tick_chart,
      },
      arrow: {
         visible: !extra.show_tick_chart && extra.category.contract_category !== 'digits',
      },
      back: { visible: false }, /* back buttom */
   };

   if (Lookback.isLookback(extra.category_display.contract_type)) {
     state.buy.payout = Lookback.formula(extra.category_display.contract_type, extra.amount);
     state.buy.potential_profit = undefined;
   }

   state.buy.update = () => {
      const { status } = state.ticks;
      state.title.text = { waiting: 'Contract Confirmation'.i18n(),
         won : 'This contract won'.i18n(),
         lost: 'This contract lost'.i18n()
      }[status];
      if(status === 'lost') {
         state.buy.potential_profit = (-state.buy.buy_price).toFixed(currencyFractionalDigits());
         state.buy.payout = (0).toFixed(currencyFractionalDigits());
         state.buy.potential_profit_text = 'Lost';
      }
      if(status === 'won') {
         state.buy.balance_after = buy.balance_after*1 + state.buy.payout*1;
         liveapi.sell_expired(); // to update balance immediately
      }
      state.buy.show_result = true;
   }

   state.back.onclick = () => hide_callback(root);
   state.arrow.onclick = (e) => {
      const $target = $(e.target);
      if(!$target.hasClass('disabled')) {
         $target.addClass('disabled');
         require(['viewtransaction/viewTransaction'], (viewTransaction) => {
            viewTransaction.init(extra.contract_id, extra.transaction_id)
               .then(() => $target.removeClass('disabled'));
         });
      }
   };

   const view = rv.bind(root[0], state)

   if(!state.arrow.visible) { register_ticks(state, extra); }
   else { state.back.visible = true; }

   show_callback(root);
}

export default  { init }
