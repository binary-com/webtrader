/**
 * Created by amin on January 14, 2016.
 */

import $ from 'jquery';
import windows from 'windows/windows';
import liveapi from 'websockets/binary_websockets';
import chartingRequestMap from 'charts/chartingRequestMap';
import rv from 'common/rivetsExtra';
import moment from 'moment';
import _ from 'lodash';
import 'jquery-growl';
import 'common/util';
import Lookback from 'trade/lookback';

const open_dialogs = {};

require(['css!viewtransaction/viewTransaction.css']);
require(['text!viewtransaction/viewTransaction.html']);

let market_data_disruption_win = null;
const show_market_data_disruption_win = (proposal) => {
   if(market_data_disruption_win){
      market_data_disruption_win.moveToTop();
      return;
   }
   const msg = 'There was a market data disruption during the contract period. For real-money accounts we will attempt to correct this and settle the contract properly, otherwise the contract will be cancelled and refunded. Virtual-money contracts will be cancelled and refunded.'.i18n();
   // const msg = proposal.validation_error;
   const root = $('<div class="data-disruption-dialog">' + msg + '</div>');

   market_data_disruption_win = windows.createBlankWindow(root, {
      title: ' There was an error '.i18n(),
      height: 200,
      resizable:false,
      collapsable:false,
      minimizable: false,
      maximizable: false,
      destroy: () => {
         market_data_disruption_win && market_data_disruption_win.dialog('destroy').remove();
         market_data_disruption_win = null;
      },
      'data-authorized': 'true'
   });

   market_data_disruption_win.dialog('open');
   window.dd = market_data_disruption_win;
}

const init_chart = (root, state, options) => {
   let data = [];
   let type = '';
   let decimal_digits = 0;
   if(options.history){
      type = 'line';
      const history = options.history;
      const times = history.times;
      const prices = history.prices;
      for(let i = 0; i < times.length; ++i) {
         data.push([times[i]*1000, prices[i]*1]);
         decimal_digits = Math.max(decimal_digits, prices[i].substring(prices[i].indexOf('.') + 1).length);
      }
   }
   if(options.candles) {
      type = 'candlestick';
      data = options.candles.map(
         (c) => [c.epoch*1000, c.open*1, c.high*1, c.low*1, c.close*1]
      )
   }
   const title = options.title;
   const el = root.find('.transaction-chart')[0];

   const chart_options = {
      credits: { href: '#', text: '' },
      chart: {
         type: 'line',
         renderTo: el,
         backgroundColor: null, /* make background transparent */
         width: 0,
         height: 0,
         marginLeft:20,
         marginRight:20
      },
      title:{
         text: '' // Removing the title because it is redundant.
      },
      tooltip:{
         xDateFormat:'%A, %b %e, %H:%M:%S GMT',
         valueDecimals: decimal_digits || undefined,
      },
      xAxis: {
         type: 'datetime',
         categories:null,
         startOnTick: false,
         endOnTick: false,
         min: data.length ? _.first(data)[0] : null,
         max: data.length ? _.last(data)[0] : null,
         labels: { overflow:"justify", format:"{value:%H:%M:%S}" },
      },
      yAxis: {
         labels: { align: 'left', x: 0, y: -2 },
         title: '',
         // gridLineWidth: 0,
      },
      series: [{
         name: title,
         data: data,
         type: type
      }],
      exporting: {enabled: false, enableImages: false},
      legend: {enabled: false},
      navigator: { enabled: true },
      plotOptions: {
         line: {
            marker: { radius: 2 }
         },
         candlestick: {
            lineColor: 'black',
            color: 'red',
            upColor: 'green',
            upLineColor: 'black',
            shadow: true
         },
      },
      rangeSelector: { enabled: false },
   };
   const chart = new Highcharts.Chart(chart_options);

   chart.addPlotLineX = (options) => {
      chart.xAxis[0].addPlotLine({
         value: options.value,
         id: options.id || options.value,
         label: {text: options.label || 'label', x: options.text_left ? -15 : 5},
         color: options.color || '#e98024',
         zIndex: 4,
         width: options.width || 2,
      });
   };

   chart.addPlotLineY = (options) => {
      chart.yAxis[0].addPlotLine({
         id: options.id || options.label,
         value: options.value,
         label: {text: options.label, align: 'center'},
         color: options.color || 'green',
         zIndex: 4,
         width: 2,
      });
   };
   return el.chart = chart;
};

/* get the tick value for a given epoch */
const get_tick_value = (symbol, epoch) => {
   return liveapi.send({ticks_history: symbol, granularity: 0, style:'ticks', start: epoch, end:epoch+2, count: 1})
      .catch((err) => console.error(err));
}

export const init = (contract_id, transaction_id) => {
   return new Promise((resolve, reject) => {
      if(open_dialogs[transaction_id]) {
         open_dialogs[transaction_id].moveToTop();
         resolve();
         return;
      }
      liveapi.send({proposal_open_contract: 1, contract_id: contract_id})
            .then((data) => {
            const proposal = data.proposal_open_contract;
            /* check for market data disruption error */
            if(proposal.underlying === undefined && proposal.shortcode === undefined) {
               show_market_data_disruption_win(proposal);
               return;
            }
            proposal.transaction_id = transaction_id;
            proposal.symbol = proposal.underlying;
            init_dialog(proposal);
            resolve();
         })
         .catch((err) => {
            console.error(err);
            $.growl.error({ message: err.message });
            reject();
         });
   });
}

const update_indicative = (data, state) => {
   if(data.error) {
      $.growl.error({message: data.error.message});
      liveapi.proposal_open_contract.forget(data.echo_req.contract_id);
      liveapi.proposal_open_contract.subscribe(data.echo_req.contract_id);
      return;
   }
   const contract = data.proposal_open_contract;
   const id = contract.contract_id || data.echo_req.contract_id,
      bid_price = contract.bid_price;
   if(contract.is_sold && !contract.exit_tick && !contract.exit_level && !state.table.user_sold && !contract.sell_spot) {

      liveapi.send({contract_id: id, proposal_open_contract: 1});
      return;
   }

   state.table.user_sold = contract.sell_time && contract.sell_time < contract.date_expiry;

   if(id != state.contract_id) { return; }
   if(contract.validation_error)
      state.validation = contract.validation_error;
   else if(contract.is_expired)
      state.validation = 'This contract has expired'.i18n();
   else if(contract.is_valid_to_sell)
      state.validation = 'Note: Contract will be sold at the prevailing market price when the request is received by our servers. This price may differ from the indicated price.'.i18n();
   if(contract.is_forward_starting && contract.date_start*1 > contract.current_spot_time*1)
      state.fwd_starting = '* Contract is not yet started.'.i18n();
   else
      state.fwd_starting = '';
   /*Do not update the current_spot and current_spot_time if the contract has expired*/
   if(state.table.date_expiry*1 >= contract.current_spot_time*1) {
      state.table.current_spot = contract.current_spot;
      state.table.current_spot_time = contract.current_spot_time;
      state.table.bid_price = contract.bid_price;
      if(state.sell.bid_prices.length > 40) {
         state.sell.bid_prices.shift();
      }
      state.sell.bid_prices.push(contract.bid_price)
      if(!_.isNil(contract.bid_price)) {
         state.sell.bid_price.value = contract.bid_price;
         [state.sell.bid_price.unit, state.sell.bid_price.cent] = contract.bid_price.toString().split(/[\.,]+/);
      }
      state.sell.is_valid_to_sell = contract.is_valid_to_sell;
      state.chart.manual_reflow();
   } else {
      /*Just change the current_spot_time to date_expiry*/
      state.table.current_spot_time = state.table.date_expiry;
   }

   // Some times backend doesn't send the entry-spot in the beginning. Setting it here to avoid any errors.
   state.table.entry_tick = contract.entry_tick ? contract.entry_tick : state.table.entry_tick;
   state.table.entry_tick_time = contract.entry_tick_time ? contract.entry_tick_time : state.table.entry_tick_time;

   if(contract.is_sold){
      state.table.is_sold = contract.is_sold;
      state.table.exit_tick = contract.exit_tick;
      state.table.exit_tick_time = contract.exit_tick_time;
      state.table.date_expiry = contract.date_expiry;
      state.table.current_spot_time = contract.exit_tick_time;
      state.table.sell_price = contract.sell_price;
      state.table.final_price = contract.sell_price;
      !state.table.user_sold && state.table.exit_tick_time && state.chart.chart.addPlotLineX({ value: state.table.exit_tick_time*1000, label: 'Exit Spot'.i18n(), text_left: true});
      !state.table.user_sold && state.table.date_expiry && state.chart.chart.addPlotLineX({ value: state.table.date_expiry*1000, label: 'End Time'.i18n()});
      state.table.user_sold && state.table.sell_price && state.chart.chart.addPlotLineX({ value: contract.sell_time*1000, label: 'Sell Time'.i18n()});
   }

   if(+state.chart.barrier !== +contract.barrier ||
      +state.chart.high_barrier !== +contract.high_barrier ||
      +state.chart.low_barrier !== +contract.low_barrier ) {
        update_barrier(true, state, contract);
   }
}

const init_dialog = (proposal) => {
   require(['text!viewtransaction/viewTransaction.html'],(html) => {
      const root = $(html).i18n();
      const state = init_state(proposal, root);
      const on_proposal_open_contract = (data) => update_indicative(data, state);

      const transWin = windows.createBlankWindow(root, {
         title: proposal.display_name + ' (' + proposal.transaction_id + ')',
         width: 700,
         minWidth: 490,
         minHeight:480,
         height:480,
         destroy: () => { },
         close: function() {
            view && view.unbind();
            liveapi.proposal_open_contract.forget(proposal.contract_id);
            liveapi.events.off('proposal_open_contract', on_proposal_open_contract);
            for(let i = 0; i < state.onclose.length; ++i)
               state.onclose[i]();
            $(this).dialog('destroy').remove();
            open_dialogs[proposal.transaction_id] = undefined;
         },
         open: () => {
            liveapi.proposal_open_contract.subscribe(proposal.contract_id);
            liveapi.events.on('proposal_open_contract', on_proposal_open_contract);
         },
         resize: () => {
            state.chart.manual_reflow();
            // state.chart.chart && state.chart.chart.reflow();
         },
         'data-authorized': 'true'
      });

      transWin.dialog('open');
      const view = rv.bind(root[0],state)
      open_dialogs[proposal.transaction_id] = transWin;
   });
}

const sell_at_market = (state, root) => {
   state.sell.sell_at_market_enabled = false; /* disable button */
   require(['text!viewtransaction/viewTransactionConfirm.html', 'css!viewtransaction/viewTransactionConfirm.css']);
   liveapi.send({sell: state.contract_id, price: 0 /* to sell at market */})
      .then((data) => {
         state.table.user_sold = true; //User successfully sold the contract
         const sell = data.sell;
         require(['text!viewtransaction/viewTransactionConfirm.html', 'css!viewtransaction/viewTransactionConfirm.css'],
            (html) => {
               const buy_price = state.table.buy_price;
               const state_confirm = {
                  longcode: state.longcode,
                  buy_price: buy_price,
                  sell_price: sell.sold_for,
                  return_percent: (100*(sell.sold_for - buy_price)/buy_price).toFixed(2)+'%',
                  transaction_id: sell.transaction_id,
                  balance: sell.balance_after,
                  currency: state.table.currency,
               };
               const $html = $(html).i18n();
               root.after($html);
               const view_confirm = rv.bind($html[0], state_confirm);
               state.onclose.push(() => {
                  view_confirm && view_confirm.unbind();
               });
            });
      })
      .catch((err) => {
         $.growl.error({ message: err.message });
         console.error(err);
      });
}

const init_state = (proposal, root) =>{
   const state = {
      route: {
         value: 'table',
         update:(value) => { state.route.value = value; }
      },
      contract_id: proposal.contract_id,
      longcode: proposal.longcode,
      validation: proposal.validation_error
      || (!proposal.is_valid_to_sell && 'Resale of this contract is not offered'.i18n())
      || ((proposal.is_settleable || proposal.is_sold) && 'This contract has expired'.i18n()) || '-',
      table: {
         is_ended: proposal.is_settleable || proposal.is_sold,
         currency: (proposal.currency ||  'USD') + ' ',
         current_spot_time: proposal.current_spot_time,
         current_spot: proposal.current_spot,
         contract_type: proposal.contract_type,
         date_start: proposal.date_start,
         date_expiry: proposal.date_expiry,
         user_sold: proposal.sell_time && proposal.sell_time < proposal.date_expiry,

         entry_tick: proposal.entry_tick || proposal.entry_spot,
         entry_tick_time: proposal.entry_tick_time ? proposal.entry_tick_time * 1 : proposal.date_start * 1,
         exit_tick: proposal.exit_tick,
         exit_tick_time: proposal.exit_tick_time,

         barrier_count: proposal.barrier_count,
         low_barrier: proposal.low_barrier,
         high_barrier: proposal.high_barrier,

         multiplier: proposal.multiplier,
         buy_price: proposal.buy_price,
         bid_price: undefined,
         final_price: proposal.is_sold ? proposal.sell_price : undefined,

         tick_count: proposal.tick_count,
         prediction: proposal.prediction,

         sell_time: proposal.sell_spot_time * 1 || undefined,
         sell_spot: proposal.sell_spot,
         sell_price: proposal.is_sold ? proposal.sell_price : undefined,
         purchase_time: proposal.purchase_time,
         is_sold_at_market: false,
         isLookback: Lookback.isLookback(proposal.contract_type),
         lb_formula: Lookback.formula(proposal.contract_type, proposal.multiplier && formatPrice(proposal.multiplier, proposal.currency ||  'USD')),
      },
      chart: {
         chart: null, /* highchart object */
         symbol: proposal.symbol,
         display_name: proposal.display_name,
         barrier: proposal.barrier,
         high_barrier: proposal.high_barrier,
         low_barrier: proposal.low_barrier,
         loading: 'Loading ' + proposal.display_name + ' ...',
         type: 'ticks', // could be 'tick' or 'ohlc'
      },
      sell: {
         bid_prices: [],
         bid_price: {
            unit: undefined,
            cent: undefined,
            value: undefined,
         },
         sell_at_market_enabled: true,
         is_valid_to_sell: false,
      },
      onclose: [], /* cleanup callback array when dialog is closed */
   };

   if(Lookback.isLookback(proposal.contract_type)) {
     [state.table.barrier_label, state.table.low_barrier_label] = Lookback.barrierLabels(proposal.contract_type);
   }

   state.sell.sell = () => sell_at_market(state, root);

   state.chart.manual_reflow = () => {
      /* TODO: find a better solution for resizing the chart  :/ */
      const h = -1 * (root.find('.longcode').height() + root.find('.tabs').height() + root.find('.footer').height()) - 16;
      if(!state.chart.chart) return;
      const container = root;// root.find('.chart-container');
      const transactionChart = container.find(".transaction-chart");
      const width = container.width() - 10,
         height = container.height();
      state.chart.chart.setSize(width, height + h , false);
      state.chart.chart.hasUserSize = null;
      if (state.chart.chart.series[0] && state.chart.chart.series[0].data.length === 0)
         state.chart.chart.showLoading();
      else
         state.chart.chart.hideLoading();
   };

   get_chart_data(state, root);
   return state;
}

const update_live_chart = (state, granularity) => {
   const key = chartingRequestMap.keyFor(state.chart.symbol, granularity);
   if(!chartingRequestMap[key]){
      const req = {
         symbol: state.chart.symbol,
         subscribe: 1,
         granularity: granularity,
         style: granularity === 0 ? 'ticks' : 'candles',
      };
      chartingRequestMap.register(req)
         .catch((err) => {
            $.growl.error({ message: err.message });
            console.error(err);
         });
   }
   /* don't register if already someone else has registered for this symbol */
   else { chartingRequestMap.subscribe(key); }

   let on_tick = undefined;
   let on_candles = undefined;

   if(granularity === 0) {
      let perv_tick = null;
      on_tick = liveapi.events.on('tick', (data) => {
         if (!data.tick || data.tick.symbol !== state.chart.symbol)
            return;
         const chart = state.chart.chart;
         const tick = data.tick;
         chart && chart.series[0].addPoint([tick.epoch*1000, tick.quote*1]);
         /* stop updating when contract is expired */
         if(tick.epoch*1 > state.table.date_expiry*1 || state.table.is_sold) {
            if(perv_tick && state.table.contract_type !== 'SPREAD') {
               state.table.exit_tick = perv_tick.quote;
               state.table.exit_tick_time = perv_tick.epoch*1;
               state.validation = 'This contract has expired'.i18n();
               state.table.is_ended = true;
            }
            clean_up();
         }
         perv_tick = tick;
      });
   }
   else {
      on_candles = liveapi.events.on('ohlc', (data) => {
         const data_key = chartingRequestMap.keyFor(data.ohlc.symbol, data.ohlc.granularity);
         if(key != data_key)
            return;
         const chart = state.chart.chart;
         if(!chart)
            return;

         const series = chart.series[0];
         const last = series.data[series.data.length - 1];

         const c = data.ohlc;
         const ohlc = [c.open_time*1000, c.open*1, c.high*1, c.low*1, c.close*1];

         if(last.x != ohlc[0]) {
            series.addPoint(ohlc, true, true);
         }
         else {
            last.update(ohlc,true);
         }
         /* stop updating when contract is expired */
         if(c.epoch*1 > state.table.date_expiry*1) {
            clean_up();
         }
      });
   }

   let clean_up_done = false;
   const clean_up = () => {
      if(clean_up_done) return;
      clean_up_done = true;
      chartingRequestMap.unregister(key);
      on_tick && liveapi.events.off('tick', on_tick);
      on_candles && liveapi.events.off('candles', on_candles);
   };
   state.onclose.push(clean_up); /* clean up */
}

const update_barrier = (isUpdate, state, contract = {}) => {
  const {chart} = state.chart;
  if (!chart) return;
  const addPlotlines = () => {
    state.chart.barrier && chart.addPlotLineY({
      id: 'barrier',
      value: state.chart.barrier*1,
      label: `${state.table.barrier_label || 'Barrier'.i18n()} ( ${state.chart.barrier} )`
    });
    state.chart.high_barrier && chart.addPlotLineY({
      id: 'high_barrier',
      value: state.chart.high_barrier*1,
      label: `${state.table.barrier_label || 'High Barrier'.i18n()} ( ${state.chart.high_barrier} )`
    });
    state.chart.low_barrier && chart.addPlotLineY({
      id: 'low_barrier',
      value: state.chart.low_barrier*1,
      label: `${state.table.low_barrier_label || 'Low Barrier'.i18n()} ( ${state.chart.low_barrier} )`,
      color: 'red'
    });
  };

  const removePlotlines = () => {
    state.chart.barrier && chart.yAxis[0].removePlotLine('barrier');
    state.chart.high_barrier && chart.yAxis[0].removePlotLine('high_barrier');
    state.chart.low_barrier && chart.yAxis[0].removePlotLine('low_barrier');
  }
  if (isUpdate) {
    removePlotlines();
    state.chart.barrier = state.table.barrier = contract.barrier;
    state.chart.high_barrier = state.table.high_barrier = contract.high_barrier;
    state.chart.low_barrier = state.table.low_barrier = contract.low_barrier;
    addPlotlines();
  } else {
    addPlotlines();
  }
}

const get_chart_data = (state, root) => {
   const table = state.table;
   const duration = Math.min(state.table.date_expiry*1, moment.utc().unix()) - (state.table.purchase_time || state.table.date_start);
   let granularity = 0;
   let margin = 0; // time margin
   if(duration <= 60*60) { granularity = 0; } // 1 hour
   else if(duration <= 2*60*60) { granularity = 60; } // 2 hours
   else if(duration <= 6*60*60) { granularity = 120; } // 6 hours
   else if(duration <= 24*60*60) { granularity = 300; } // 1 day
   else { granularity = 3600 } // more than 1 day
   margin = granularity === 0 ? Math.max(3, 30*duration/(60*60) | 0) : 3*granularity;
   const request = {
      ticks_history: state.chart.symbol,
      start: (state.table.purchase_time || state.table.date_start)*1 - margin, /* load around 2 more thicks before start */
      end: state.table.sell_time ? state.table.sell_time*1 + margin : state.table.exit_tick_time ? state.table.exit_tick_time*1 + margin : 'latest',
      style: 'ticks',
      count: 4999, /* maximum number of ticks possible */
   };
   if(granularity !== 0) {
      request.granularity = granularity;
      request.style = 'candles';
      state.chart.type = 'candles';
   }

   if(!state.table.is_ended) {
      update_live_chart(state, granularity);
   }

   return liveapi.send(request).then((data) => {

      state.chart.loading = '';

      const options = { title: state.chart.display_name };
      if(data.history) options.history = data.history;
      if(data.candles) options.candles = data.candles;
      const chart = init_chart(root, state, options);

      state.table.entry_tick_time && chart.addPlotLineX({ value: state.table.entry_tick_time*1000, label: 'Entry Spot'.i18n()});

      (!state.table.user_sold || state.table.contract_type === "SPREAD") && chart.addPlotLineX({ value: state.table.exit_tick_time*1000, label: 'Exit Spot'.i18n(), text_left: true});

      state.table.entry_tick_time && chart.addPlotLineX({ value: state.table.entry_tick_time*1000, label: 'Entry Spot'.i18n()});
      !state.table.user_sold && state.table.exit_tick_time && chart.addPlotLineX({ value: state.table.exit_tick_time*1000, label: 'Exit Spot'.i18n(), text_left: true});

      !state.table.user_sold && state.table.date_expiry && chart.addPlotLineX({ value: state.table.date_expiry*1000, label: 'End Time'.i18n()});
      state.table.date_start && chart.addPlotLineX({ value: state.table.date_start*1000, label: 'Start Time'.i18n() ,text_left: true });

      update_barrier(false, state);

      state.table.stop_loss_level && chart.addPlotLineY({value: state.table.stop_loss_level*1, label: 'Stop Loss ('.i18n() + state.table.stop_loss_level + ')', color: 'red'});
      state.table.stop_profit_level && chart.addPlotLineY({value: state.table.stop_profit_level*1, label: 'Stop Profit ('.i18n() + state.table.stop_profit_level + ')'});

      state.table.user_sold && chart.addPlotLineX({ value: state.table.sell_time*1000, label: 'Sell Spot'.i18n(), text_left: true});

      state.chart.chart = chart;
      state.chart.manual_reflow();
   })
      .catch((err) => {
         state.chart.loading = err.message;
         console.error(err);
      });
}

export default  { init };
