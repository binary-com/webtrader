import _ from 'lodash';
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
      // state.ticks.array updates => routine fires
      const model = this.model;
      console.log('routine(): ', model.status);
      console.log('model: ', model);
      const addPlotLineX = (chart, options) => {
         const label_left_or_right = options.label === 'Entry Spot' ? -15 : 5;

         chart.xAxis[0].addPlotLine({
            value: options.value,
            id: options.id || options.value,
            label: {text: options.label || 'label', x:  label_left_or_right },
            color: options.color || '#e98024',
            width: options.width || 2,
         });
      };

      const addPlotLineY = (chart,options) => {
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
      // TODO: clean this up
      const tick_idx = ticks.length;
      const tick = _.last(ticks);
      const { contract_category } = model.category.contract_category;
      const { contract_is_finished } = model;

      if (tick_idx === 0) return;

      if (contract_is_finished) {
            const exit_spot = model.getExitSpot(tick_idx - 1);
            addPlotLineX(el.chart, exit_spot);
            return;
      }

      el.chart.series[0].addPoint([tick_idx, tick.quote]);

      // 1. Add Entry spot to Chart
      if (tick_idx === 1) {
            const entry_spot = model.getEntrySpot(tick_idx);
            addPlotLineX(el.chart, entry_spot);
            // add barrier
            const barrier = model.getBarrier();
            addPlotLineY(el.chart, barrier);
      }
      // asian barrier
      if (contract_category === 'asian') {
            const barrier = model.getBarrier();
            el.chart.yAxis[0].removePlotLine(barrier.id);
            addPlotLineY(el.chart, barrier);
      }
      // 2. Exit spot
      const is_finished = model.status !== 'waiting';
      if (is_finished) {
            const exit_spot = model.getExitSpot(tick_idx);
            addPlotLineX(el.chart, exit_spot);
            return;
      }

   }
};

const last_1000_ticks = []; /* record the last 1k ticks returned */
liveapi.events.on('tick', (data) => {
   const tick = data.tick;
   tick.quote *= 1;
   tick.epoch *= 1;
   last_1000_ticks.push(tick);
   if(last_1000_ticks.length > 1000)
      last_1000_ticks.shift();
});

const register_ticks = (state, extra) => {
   let tick_count = extra.tick_count * 1,
      symbol = extra.symbol,
      purchase_epoch = state.buy.purchase_time * 1,
      contract,
      open_contract_cb;

   /* No need to worry about WS connection getting closed, because the user will be logged out */
   const add_tick = (tick) => {
      const is_new_tick = !state.ticks.array.some((t) => t.epoch * 1 === tick.epoch * 1);
      const contract_has_finished = contract.status !== 'open' && !state.ticks.contract_is_finished;

      if (contract_has_finished) {
            console.log('contract has finished');
            state.ticks.contract_is_finished = true;
            state.ticks.exit_tick = contract.exit_tick ? contract.exit_tick : null;
            state.ticks.status = contract.status;
            liveapi.events.off('proposal_open_contract', open_contract_cb);
            liveapi.proposal_open_contract.forget(extra.contract_id);
            state.ticks.array.push({});
            on_contract_finished();
      }

      if (is_new_tick) {
            state.buy.barrier = contract.barrier;
            if (tick_count > 0) {
                  on_add_new_tick_to_chart(tick);
                  --tick_count;
            }
      }
   }

   const on_add_new_tick_to_chart = (tick) => {
      const decimal_digits = chartingRequestMap.digits_after_decimal(extra.pip, symbol);
      state.ticks.array.push({
         quote: tick.quote,
         epoch: tick.epoch,
         number: state.ticks.array.length + 1,
         tooltip: moment.utc(tick.epoch*1000).format("dddd, MMM D, HH:mm:ss") + "<br/>" +
         extra.symbol_name + " " + tick.quote.toFixed(decimal_digits),
         decimal_digits,
      });
   };

   const on_contract_finished = () => {
      state.buy.update();
      state.back.visible = true;
   };

   let entry = null, expiry = null;
   let tracking_timeout_set = false;
   const track_ticks = () => {
      tracking_timeout_set = false;
      last_1000_ticks.filter(
         (tick) => (tick.symbol === extra.symbol && tick.epoch*1 >= entry && tick.epoch*1 <= expiry)
      ).forEach(add_tick);
      if(tick_count > 0) {
         tracking_timeout_set = true;
         setTimeout(track_ticks, 300);
      }
   }

   open_contract_cb = liveapi.events.on('proposal_open_contract', (data) => {
      const is_different_open_contract_stream = data.proposal_open_contract.contract_id !== extra.contract_id;
      if (is_different_open_contract_stream) {
            return;
      };

      if (data.error) {
            on_open_proposal_error(data);
            return;
      }
      console.log(data);
      on_open_proposal_success(data);
   });

   const on_open_proposal_error = (data) => {
      $.growl.error({message: data.error.message});
      liveapi.proposal_open_contract.forget(data.echo_req.contract_id);
      liveapi.proposal_open_contract.subscribe(data.echo_req.contract_id);
   };

   const on_open_proposal_success = (data) => {
      contract = data.proposal_open_contract;
      entry = contract.entry_tick_time ? contract.entry_tick_time * 1 : entry;
      expiry = contract.exit_tick_time ? contract.exit_tick_time * 1 : contract.date_expiry ? contract.date_expiry * 1: expiry;
      const should_track_ticks = !tracking_timeout_set && entry && expiry;
      if (should_track_ticks) {
            track_ticks();
      }
   };
}

/** @param data
*  @param extra = {
*    currency: ,
*    symbol: "frxXAUUSD",
*    symbol_name: "Gold/USD",
*    category: {},
*    category_display: ,
*    duration_unit: ,
*      pip: "0.001",
*   }
* @param show_callback
* @param hide_callback
**/
export const init = (data, extra, show_callback, hide_callback) => {
   display_decimals = data.display_decimals || 3;
   const root = $(html).i18n();
   const buy = data.buy;
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
         exit_tick: null,
         getExitSpot: (inx) => ({value: inx, label: 'Exit Spot'.i18n()}),
         getEntrySpot: (inx) => ({value: inx, label: 'Entry Spot'.i18n()}),
         getBarrier: () => {
            const { barrier } = state.buy;
            return { value: +barrier, label: 'Barrier ('.i18n() + barrier + ')', id: 'plot-barrier-y'};
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
