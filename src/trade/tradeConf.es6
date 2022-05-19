import $ from 'jquery';
import moment from 'moment';
import Lookback from './lookback';
import chartingRequestMap from '../charts/chartingRequestMap';
import { getLabelEl } from '../charts/chartSettings';
import liveapi from '../websockets/binary_websockets';
import rv from '../common/rivetsExtra';
import '../common/util';
import 'css!../trade/tradeConf.css';
import html from 'text!../trade/tradeConf.html';

/* rv binder to show tick chart for this confirmation dialog */
const CHART_LABELS = ['entry_spot_tick', 'barrier', 'exit_spot_tick'];
rv.binders['tick-chart'] = {
   priority: 65, /* a low priority to apply last */
   bind: function(el) {
      const model = this.model;
      el.chart = new Highcharts.Chart({
          subtitle: {
            text: getLabelEl(CHART_LABELS),
            useHTML: true,
         },
         title: '',
         credits: {enabled: false},
         chart: {
            type: 'line',
            renderTo: el,
            backgroundColor: null, /* make background transparent */
            width: 400,
            height: 144,
            marginLeft: 20,
            marginTop: 35,
            marginBottom: 15,
         },
         tooltip: {
            useHTML: true,
            formatter: function () {
               const tick = model.array[this.x - 1];
               if (tick && tick.tooltip) {
                  return `<div class='tooltip-body'>${tick.tooltip}</div>`;
               }
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
                     return addComma(this.value, model.display_decimals);
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
            },
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
      const barrier = model.makeBarrier();
      const { contract_is_finished } = model;

      if (barrier) {
            drawBarrier(barrier);
      }

      if (contract_is_finished) {
            drawEndTime(model, ticks);
            return;
      }

      if (tick_idx === 0) return;
      drawTick(tick_idx);

      if (tick_idx === 1) {
            drawStartTime(tick_idx);
      }

      function drawEndTime(model, ticks) {
            let exit_time_idx = ticks.findIndex((tick) => tick.epoch === (+model.exit_tick_time));
            drawXLine(el.chart, { value: exit_time_idx + 1, dashStyle: 'Dash' });
      };

      function drawTick(tick_idx) {
            const tick = ticks[tick_idx -1];
            el.chart.series[0].addPoint([tick_idx, tick.quote]);
      };

      function drawStartTime(tick_idx) {
            drawXLine(el.chart, { value: tick_idx });
      };

      function drawBarrier(barrier) {
            el.chart.yAxis[0].removePlotLine(barrier.id);
            drawYLine(el.chart, barrier);
      };

      function drawXLine(chart, options) {
   
            chart.xAxis[0].addPlotLine({
               value: options.value,
               id: options.id || options.value,
               color: options.color || '#e98024',
               width: options.width || 2,
               dashStyle: options.dashStyle || false,
            });
      };

      function drawYLine(chart, options) {
            chart.yAxis[0].addPlotLine({
               id: options.id,
               value: options.value,
               color: 'green',
               width: 2,
            });
            /* Add plotline value to invisible seri to make the plotline always visible. */
            chart.series[1].addPoint([1, options.value*1]);
      };
   }
};

const registerTicks = (state, extra) => {
   let proposal_open_contract;
   let on_proposal_open_contract;
   let on_tick;
   let is_path_dependent_last_tick = false;
   let { tick_count } = extra;

   const addTick = (tick) => {
      const is_or_after_contract_entry = (+tick.epoch) >= (+proposal_open_contract.entry_tick_time);
      const is_new_tick = !state.ticks.array.some((state_tick) => state_tick.epoch === (+tick.epoch));
      const should_add_new_tick = is_new_tick && !state.ticks.contract_is_finished && is_or_after_contract_entry;

      if (should_add_new_tick) {
         const contract_is_finished = proposal_open_contract.status !== 'open' && (tick_count < -1 || is_path_dependent_last_tick);
         state.buy.barrier = proposal_open_contract.barrier ? (+proposal_open_contract.barrier) : null;

         if (contract_is_finished) {
            onContractFinished(proposal_open_contract);
            updateChart();
         }

         tick_count--;
         if (tick_count > -1) {
            is_path_dependent_last_tick = tick.epoch >= proposal_open_contract.exit_tick_time ? true : false;
            addTickToState(tick);
         }
      }
   }

   function addTickToState(tick) {
      const tooltip = makeTooltip(tick);

      state.ticks.array.push({
         quote: (+tick.quote),
         epoch: (+tick.epoch),
         number: state.ticks.array.length + 1,
         tooltip,
      });

      function makeTooltip(tick) {
            const tick_time = moment.utc(tick.epoch * 1000).format('dddd, MMM D, HH:mm:ss');
            const { symbol_name } = extra;
            const tick_quote_formatted = addComma(+tick.quote, state.ticks.display_decimals);

            return `${tick_time}<br/>${symbol_name} ${(tick_quote_formatted)}`;
      };
   };

   function updateChart() {
            const tick_arr_copy = state.ticks.array.slice();
            state.ticks.array = [...tick_arr_copy];
    };

   const onContractFinished = (proposal_open_contract) => {
      forgetStreamAndCb();

      state.ticks.contract_is_finished = true;
      state.ticks.exit_tick_time = proposal_open_contract.exit_tick_time ? proposal_open_contract.exit_tick_time : null;
      state.ticks.status = proposal_open_contract.status;

      state.buy.update();
      state.back.visible = true;

      function forgetStreamAndCb() {
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
                  onOpenProposalError(data);
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

      const has_missing_ticks = (+first_tick_epoch > +entry_tick_time);
      if (has_missing_ticks) {
            is_getting_history = true;
            first_tick_epoch = entry_tick_time;
            getTickHistory(entry_tick_time, extra.symbol);
      }

      if (is_getting_history) {
            temp_ticks.push(data.tick);
            return;
      };

      if (temp_ticks.length > 0) {
            temp_ticks.forEach((stored_tick) => addTick(stored_tick));
            temp_ticks = [];
      }

      addTick(data.tick);
    });

    function getTickHistory(start, ticks_history) {
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

   const onOpenProposalError = (data) => {
      $.growl.error({message: data.error.message});
      liveapi.proposal_open_contract.forget(data.echo_req.contract_id);
      liveapi.proposal_open_contract.subscribe(data.echo_req.contract_id);
   };
};

export const init = (data, extra, showCallback, hideCallback) => {
   const display_decimals = chartingRequestMap.digits_after_decimal(extra.pip, extra.symbol);
   const root = $(html).i18n();
   const { buy } = data;
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
         display_decimals,
         exit_tick_time: null,
         is_path_dependent: null,
         makeBarrier: () => {
            const { barrier } = state.buy;
            if (barrier) {
                  return { value: +barrier };
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
   };

   state.back.onclick = () => hideCallback(root);
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

   const view = rv.bind(root[0], state);
   if(!state.arrow.visible) { registerTicks(state, extra); }
   else {
      state.back.visible = true; 
      liveapi.events.on('balance', data => {
         if (local_storage.get("authorize")) {
            const loginId = local_storage.get('authorize').loginid;
            if (data.balance && data.balance.loginid === loginId && state.buy.balance_after !== data.balance.balance ) {
               state.buy.balance_after = data.balance.balance;
            };
         }
      });
   }

   showCallback(root);
}

export default  { init }
