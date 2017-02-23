/*
 * Created by amin on December 4, 2015.
 */

import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import liveapi from '../websockets/binary_websockets';
import rv from '../common/rivetsExtra';
import chartingRequestMap from '../charts/chartingRequestMap';
import html from 'text!../trade/tradeConf.html';
import 'css!../trade/tradeConf.css';

require(['websockets/stream_handler']);
const barsTable = chartingRequestMap.barsTable;

/* rv binder to show tick chart for this confirmation dialog */
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
            width: (el.getAttribute('width') || 350)*1,
            height: (el.getAttribute('height') || 120)*1,
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
            labels: { align: 'left', x: 0, },
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
      const model = this.model;
      const addPlotLineX = (chart, options) => {
         chart.xAxis[0].addPlotLine({
            value: options.value,
            id: options.id || options.value,
            label: {text: options.label || 'label'},
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

      const index = ticks.length;
      if(index == 0) return;

      const tick = _.last(ticks);
      el.chart.series[0].addPoint([index, tick.quote*1]);

      const plot_x = model.getPlotX(); // could return null
      plot_x && addPlotLineX(el.chart,plot_x);
      const plot_y = model.getPlotY(); // could return null
      plot_y && el.chart.yAxis[0].removePlotLine(plot_y.id);
      plot_y && addPlotLineY(el.chart, plot_y);

   } /* end of routine() */
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
      fn = null;

   /* No need to worry about WS connection getting closed, because the user will be logged out */
   const add_tick = (tick) =>{
      if (_.findIndex(state.ticks.array, (t) => (t.epoch*1 === tick.epoch*1)) === -1 && tick_count > 0) {
         const decimal_digits = chartingRequestMap.digits_after_decimal(extra.pip, symbol);
         state.ticks.array.push({
            quote: tick.quote,
            epoch: tick.epoch,
            number: state.ticks.array.length + 1,
            tooltip: moment.utc(tick.epoch*1000).format("dddd, MMM D, HH:mm:ss") + "<br/>" +
            extra.symbol_name + " " + tick.quote,
            decimal_digits : decimal_digits
         });
         --tick_count;
         if (tick_count === 0) {
            state.ticks.update_status();
            state.buy.update();
            /* show buy-price final and profit & update title */
            state.back.visible = true;
            /* show back button */
            liveapi.events.off('proposal_open_contract', fn);
            liveapi.proposal_open_contract.forget(extra.contract_id);
            /* unregister from proposal_open_contract stream */
         }
         /* update state for each new tick in Up/Down && Asians contracts */
         if (state.ticks.category !== 'Digits')
            state.ticks.update_status();
      }
   }

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

   fn = liveapi.events.on('proposal_open_contract', (data) => {
      const contract = data.proposal_open_contract;
      if(contract.contract_id !== extra.contract_id) return;
      entry = contract.entry_tick_time * 1;
      expiry = contract.date_expiry * 1; /* date_expiry gets updated when contract is settled !!! */
      if(!tracking_timeout_set)
         track_ticks();
      return;
   });
}

/** @param data
*  @param extra = {
*    currency: ,
*    symbol: "frxXAUUSD",
*    symbol_name: "Gold/USD",
*    category: ,
*    category_display: ,
*    duration_unit: ,
*      pip: "0.001",
*   }
* @param show_callback
* @param hide_callback
**/
export const init = (data, extra, show_callback, hide_callback) => {
   const root = $(html).i18n();
   const buy = data.buy;
   const decimal_digits = chartingRequestMap.digits_after_decimal(extra.pip, extra.symbol);
   extra.getbarrier = (tick) => {
      let barrier = tick.quote*1;
      if(extra.barrier && _(['higher','lower']).includes(extra.category_display)) {
         barrier += extra.barrier*1;
      }
      return barrier.toFixed(decimal_digits);
   }
   const state = {
      title: {
         text: 'Contract Confirmation'.i18n(),
      },
      buy: {
         barrier: null,
         message: buy.longcode,
         balance_after: buy.balance_after,
         buy_price: buy.buy_price,
         purchase_time: buy.purchase_time,
         start_time: buy.start_time,
         transaction_id: buy.transaction_id,
         payout: buy.payout,
         currency: extra.currency,
         potential_profit : buy.payout - buy.buy_price,
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
         average: () => {
            const ticks = state.ticks;
            const array = ticks.array;
            let sum = 0;
            for(let i = 0; i < array.length; ++i)
               sum += array[i].quote*1;
            const avg = sum / (array.length || 1);
            return avg;
         },
         getPlotX: () => {
            const ticks = state.ticks;
            const inx = ticks.array.length;
            if(inx === 1) return {value: inx, label: 'Entry Spot'.i18n()};
            if(inx === ticks.tick_count) return {value:inx, label: 'Exit Spot'.i18n()}
            return null;
         },
         getPlotY: () => {
            const ticks = state.ticks;
            const inx = ticks.array.length;
            const tick = ticks.array[inx-1];
            if(ticks.category === 'Up/Down' && inx === 1) {
               const barrier = extra.getbarrier(tick);
               state.buy.barrier = barrier; /* update barrier value to show in confirm dialog */
               return {value: barrier*1, label:'Barrier ('.i18n() +barrier+')', id: 'plot-barrier-y'};
            }

            if(ticks.category === 'Asians') {
               //https://trello.com/c/ticslmb4/518-incorrect-decimal-points-for-asian-average
               const avg = ticks.average().toFixed(decimal_digits + 1);
               return {value: avg, label:'Average ('.i18n() + avg + ')', id: 'plot-barrier-y'};
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
         visible: !extra.show_tick_chart && extra.category !== 'Digits',
      },
      back: { visible: false }, /* back buttom */
   };

   state.buy.update = () => {
      const status = state.ticks.status;
      state.title.text = { waiting: 'Contract Confirmation'.i18n(),
         won : 'This contract won'.i18n(),
         lost: 'This contract lost'.i18n()
      }[status];
      if(status === 'lost') {
         state.buy.potential_profit = -state.buy.buy_price;
         state.buy.payout = 0;
         state.buy.potential_profit_text = 'Lost';
      }
      if(status === 'won') {
         state.buy.balance_after = buy.balance_after*1 + state.buy.payout*1;
         liveapi.sell_expired(); // to update balance immediately
      }
      state.buy.show_result = true;
   }
   state.ticks.update_status = () => {
      const decimal_digits = chartingRequestMap.digits_after_decimal(extra.pip, extra.symbol);

      const first_quote = _.head(state.ticks.array).quote.toFixed(decimal_digits) + '',
         last_quote = _.last(state.ticks.array).quote.toFixed(decimal_digits) + '',
         barrier = extra.getbarrier(_.head(state.ticks.array)) + '',
         digits_value = state.ticks.value + '',
         average = state.ticks.average().toFixed(5);
      const category = state.ticks.category,
         display = state.ticks.category_display;
      const css = {
         Digits: {
            matches:  _.last(last_quote) === digits_value,
            differs:  _.last(last_quote) !== digits_value,
            over: _.last(last_quote)*1 > digits_value*1,
            under: _.last(last_quote)*1 < digits_value*1,
            odd: (_.last(last_quote)*1)%2 === 1,
            even: (_.last(last_quote)*1)%2 === 0
         },
         'Up/Down': {
            rise: last_quote*1 > first_quote*1,
            fall: last_quote*1 < first_quote*1,
            higher: last_quote*1 > barrier*1,
            lower: last_quote*1 < barrier*1,
         },
         Asians: {
            'asian up': average < last_quote*1,
            'asian down': average > last_quote*1,
         }
      };
      /* set the css class */
      state.ticks.status = css[category][display] ? 'won' : 'lost';
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
