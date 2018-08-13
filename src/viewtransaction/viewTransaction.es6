import $ from 'jquery';
import windows from 'windows/windows';
import liveapi from 'websockets/binary_websockets';
import chartingRequestMap from 'charts/chartingRequestMap';
import rv from 'common/rivetsExtra';
import moment from 'moment';
import 'jquery-growl';
import 'common/util';
import Lookback from 'trade/lookback';

const open_dialogs = {};
const display_decimals = 3;

require(['css!viewtransaction/viewTransaction.css']);
require(['text!viewtransaction/viewTransaction.html']);

let market_data_disruption_win = null;
const show_market_data_disruption_win = (proposal) => {
   if(market_data_disruption_win){
      market_data_disruption_win.moveToTop();
      return;
   }
   const msg = 'There was a market data disruption during the contract period. For real-money accounts we will attempt to correct this and settle the contract properly, otherwise the contract will be cancelled and refunded. Virtual-money contracts will be cancelled and refunded.'.i18n();
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

   if (options.history) {
      type = 'line';
      const { history } = options;
      const { times } = history;
      const { prices } = history;

      for (let i = 0; i < times.length; ++i) {
         data.push([times[i] * 1000, prices[i] * 1]);
         decimal_digits = Math.max(decimal_digits, prices[i].substring(prices[i].indexOf('.') + 1).length);
      }
   }

   if (options.candles) {
      type = 'candlestick';
      data = options.candles.map(
         (c) => [c.epoch*1000, c.open*1, c.high*1, c.low*1, c.close*1]
      )
   }

   const { title } = options;
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
      title: { text: '' },
      tooltip: {
         xDateFormat:'%A, %b %e, %H:%M:%S GMT',
         valueDecimals: decimal_digits || undefined,
      },
      xAxis: {
         type: 'datetime',
         categories:null,
         startOnTick: false,
         endOnTick: false,
         min: data.length ? data[0][0] : null,
         max: data.length ? data[data.length - 1][0] : null,
         labels: { overflow:"justify", format:"{value:%H:%M:%S}" },
      },
      yAxis: {
        labels: {
          align: 'left',
          x: 0,
          y: -2,
          formatter() {
            return addComma(this.value.toFixed(display_decimals));
          },
        },
         title: '',
      },
      series: [{
         name: title,
         data: data,
         type: type
      }],
      exporting: { enabled: false, enableImages: false},
      legend: { enabled: false},
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
         label: { text: options.label || 'label', x: options.text_left ? -15 : 5},
         color: options.color || '#e98024',
         zIndex: 4,
         width: options.width || 2,
         dashStyle: options.dashStyle,
      });
   };

   chart.addPlotLineY = (options) => {
      chart.yAxis[0].addPlotLine({
         id: options.id || options.label,
         value: options.value,
         label: { text: options.label, align: 'center'},
         color: options.color || 'green',
         zIndex: 4,
         width: 2,
      });
   };
   return el.chart = chart;
};

/* get the tick value for a given epoch */
const get_tick_value = (symbol, epoch) => {
   return liveapi.send({ ticks_history: symbol, granularity: 0, style:'ticks', start: epoch, end: epoch + 2, count: 1 })
      .catch((err) => console.error(err));
}

export const init = (contract_id, transaction_id) => {
   return new Promise((resolve, reject) => {
      if(open_dialogs[transaction_id]) {
         open_dialogs[transaction_id].moveToTop();
         resolve();
         return;
      }
      liveapi.send({proposal_open_contract: 1, contract_id})
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
};

const handle_error = (message) => {
  $.growl.error({ message });
  liveapi.proposal_open_contract.forget(data.echo_req.contract_id);
  liveapi.proposal_open_contract.subscribe(data.echo_req.contract_id);
};

const update_indicative = (data, state) => {
  const contract = data.proposal_open_contract;
  console.log('state: ', state);
  console.log('open contract', contract);

  draw_chart(contract, state)
  make_note(contract, state);

  const contract_has_finished = contract.status !== 'open';
  if (contract_has_finished) {
    console.log('===== Contract has finished: =====', contract.status, contract);
    on_contract_finished(contract, state);
    return;
  }
  // Ongoing contract - update state
  update_state_table();
  update_state_sell();
  handle_forward_starting();

  state.chart.manual_reflow();

  function update_state_table() {
    state.proposal_open_contract.user_sold = contract.sell_time && contract.sell_time < contract.date_expiry;
    state.proposal_open_contract.current_spot = contract.current_spot;
    state.proposal_open_contract.current_spot_time = contract.current_spot_time;
    state.proposal_open_contract.bid_price = contract.bid_price;

    state.proposal_open_contract.entry_tick = contract.entry_tick ? contract.entry_tick : state.proposal_open_contract.entry_tick;
    state.proposal_open_contract.entry_tick_time = contract.entry_tick_time ? contract.entry_tick_time : state.proposal_open_contract.entry_tick_time;
  };

  function update_state_sell() {
    state.sell.is_valid_to_sell = contract.is_valid_to_sell;

    if (contract.bid_price) {
      state.sell.bid_price.value = contract.bid_price;
      [state.sell.bid_price.unit, state.sell.bid_price.cent] = contract.bid_price.toString().split(/[\.,]+/);
    }
  }

  function handle_forward_starting() {
    const constract_is_forward_starting = contract.is_forward_starting && contract.date_start * 1 > contract.current_spot_time * 1;
    if (constract_is_forward_starting) {
      state.fwd_starting = '* Contract has not started yet'.i18n();
    } else {
      state.fwd_starting = '';
    }
  }
};

function draw_chart(contract, state) {
  draw_sparkline(contract, state);

  const { chart } = state.chart;
  if (!chart) return;

  draw_vertical_lines(contract, state, chart);
  handle_barrier(contract, state);
};

function draw_vertical_lines(contract, state, chart) {
  const { entry_tick_time, sell_spot_time, exit_tick_time, date_expiry, date_start, sell_time } = contract;
  const text_left = true;
  draw_entry_spot(entry_tick_time);
  draw_start_time(date_start, text_left);

  draw_exit_spot(sell_spot_time, exit_tick_time, text_left);
  draw_end_time(date_expiry);

  function draw_entry_spot(entry_tick_time) {
    const label = 'Entry Spot'.i18n();
    if (!entry_tick_time || chart_has_label(label)) return;
    chart.addPlotLineX({ value: entry_tick_time * 1000, label });
  };

  function draw_exit_spot(sell_spot_time, exit_tick_time, text_left) {
    const label = 'Exit Spot'.i18n();
    const contract_has_no_exit_time = !sell_spot_time && !exit_tick_time;
    if (contract_has_no_exit_time || chart_has_label(label)) return;

    let value;
    if (!!contract.is_path_dependent || contract.status === 'sold') {
      value = sell_spot_time * 1000;
    } else {
      value = exit_tick_time * 1000;
    }

    chart.addPlotLineX({ value, label, text_left, dashStyle: 'Dash' });
  };

  function draw_end_time(date_expiry) {
    const label = 'End Time'.i18n();
    if (!date_expiry || chart_has_label(label)) return false;

    chart.addPlotLineX({ value: date_expiry * 1000, label, dashStyle: 'Dash' });
  };

  function draw_start_time(date_start, text_left) {
    const label = 'Start Time'.i18n();
    if (!date_start || chart_has_label(label)) return;
    chart.addPlotLineX({ value: date_start * 1000, label, text_left });
  };

  function chart_has_label(label) {
    if (state.chart.added_labels.includes(label)) return true;

    state.chart.added_labels.push(label);
    return false
  };
};

const on_contract_finished = (contract, state) => {
  state.note = 'This contract has expired'.i18n();
  state.table = {...state.table, ...contract};
  state.proposal_open_contract.is_ended = true;
  state.proposal_open_contract.status = contract.status;
  state.table.is_sold = contract.is_sold;
  state.proposal_open_contract.exit_tick = contract.exit_tick;
  state.proposal_open_contract.exit_tick_time = contract.exit_tick_time;
  state.proposal_open_contract.date_expiry = contract.date_expiry;
  state.table.sell_price = contract.sell_price;
  state.proposal_open_contract.sell_price = contract.sell_price;
};

const make_note = (contract, state) => {
  if (contract.validation_error) {
    state.note = contract.validation_error;
  } else if (contract.is_expired) {
    state.note = 'This contract has expired'.i18n();
  } else if (contract.is_valid_to_sell) {
    state.note = 'Note: Contract will be sold at the prevailing market price when the request is received by our servers. This price may differ from the indicated price.'.i18n();
  }
};

const handle_barrier = (contract, state) => {
  const { barrier, high_barrier, low_barrier } = contract;
  const should_update_barrier = +state.proposal_open_contract.barrier !== +barrier ||
    +state.proposal_open_contract.high_barrier !== +high_barrier ||
    +state.proposal_open_contract.low_barrier !== +low_barrier;

  if (should_update_barrier) {
    // TODO: move state update one step up
    state.proposal_open_contract = { ...state.proposal_open_contract, barrier, high_barrier, low_barrier };
    draw_barrier(state, contract);
  }
};

const draw_sparkline = (contract, state) => {
  if (state.sell.bid_prices.length > 40) {
    state.sell.bid_prices.shift();
  }
  state.sell.bid_prices.push(contract.bid_price);
};

const init_dialog = (proposal) => {
   require(['text!viewtransaction/viewTransaction.html'], (html) => {
      const root = $(html).i18n();
      const state = init_state(proposal, root);

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
         },
         'data-authorized': 'true'
      });

      transWin.dialog('open');
      const view = rv.bind(root[0],state)
      open_dialogs[proposal.transaction_id] = transWin;

      function on_proposal_open_contract(data) {
        const is_different_stream = +data.proposal_open_contract.contract_id !== +state.proposal_open_contract.contract_id;
        if (is_different_stream) return;

        if (data.error) {
          handle_error(data.error.message);
          return;
        }

        update_indicative(data, state)
      };
   });
}

const sell_at_market = (state, root) => {
   state.sell.sell_at_market_enabled = false;
   require(['text!viewtransaction/viewTransactionConfirm.html', 'css!viewtransaction/viewTransactionConfirm.css']);
   liveapi.send({sell: state.proposal_open_contract.contract_id, price: 0 /* to sell at market */})
      .then((data) => {
         state.proposal_open_contract.user_sold = true;
         const sell = data.sell;
         require(['text!viewtransaction/viewTransactionConfirm.html', 'css!viewtransaction/viewTransactionConfirm.css'],
            (html) => {
               const buy_price = state.proposal_open_contract.buy_price;
               const state_confirm = {
                  longcode: state.proposal_open_contract.longcode,
                  buy_price,
                  sell_price: sell.sold_for,
                  return_percent: (100*(sell.sold_for - buy_price)/buy_price).toFixed(2)+'%',
                  transaction_id: sell.transaction_id,
                  balance: sell.balance_after,
                  currency: state.proposal_open_contract.currency,
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
};

const init_state = (proposal, root) => {
  console.log('proposal: ', proposal);
   const state = {
      route: {
         value: 'table',
         update: (value) => { state.route.value = value; },
      },
      note: proposal.validation_error
      || (!proposal.is_valid_to_sell && 'Resale of this contract is not offered'.i18n())
      || ((proposal.is_settleable || proposal.is_sold) && 'This contract has expired'.i18n()) || '-',
      table: {
        tick_count: proposal.tick_count,
        sell_time: proposal.sell_spot_time * 1 || undefined,
        sell_spot: proposal.sell_spot,
        sell_price: proposal.is_sold ? proposal.sell_price : undefined,
        purchase_time: proposal.purchase_time,
        isLookback: Lookback.isLookback(proposal.contract_type),
        lb_formula: Lookback.formula(proposal.contract_type, proposal.multiplier && formatPrice(proposal.multiplier, proposal.currency ||  'USD')),
      },
      chart: {
         chart: null, /* highchart object */
         symbol: proposal.symbol,
         display_name: proposal.display_name,
         loading: 'Loading ' + proposal.display_name + ' ...',
         added_labels: [],
         type: 'ticks', // could be 'tick' or 'ohlc'
         manual_reflow: () => {
          /* TODO: find a better solution for resizing the chart  :/ */
          const h = -1 * (root.find('.longcode').height() + root.find('.tabs').height() + root.find('.footer').height()) - 16;
          if(!state.chart.chart) return;
          const container = root;
          const transactionChart = container.find(".transaction-chart");
          const width = container.width() - 10;
          const height = container.height();

          state.chart.chart.setSize(width, height + h , false);
          state.chart.chart.hasUserSize = null;
          if (state.chart.chart.series[0] && state.chart.chart.series[0].data.length === 0) {
            state.chart.chart.showLoading();
            return;
          }
          state.chart.chart.hideLoading();
       },
      },
      proposal_open_contract: {
        ...proposal,
        entry_tick: proposal.entry_tick || proposal.entry_spot,
        entry_tick_time: proposal.entry_tick_time ? proposal.entry_tick_time * 1 : proposal.date_start * 1,
        currency: (proposal.currency ||  'USD') + ' ',
        is_ended: proposal.is_settleable || proposal.is_sold,
        is_sold_at_market: false,
        user_sold: proposal.sell_time && proposal.sell_time < proposal.date_expiry,
        isLookback: Lookback.isLookback(proposal.contract_type),
        lb_formula: Lookback.formula(proposal.contract_type, proposal.multiplier && formatPrice(proposal.multiplier, proposal.currency ||  'USD')),
      },
      sell: {
         bid_prices: [],
         bid_price: {
            unit: undefined,
            cent: undefined,
            value: undefined,
         },
         sell: () => sell_at_market(state, root),
         sell_at_market_enabled: true,
         is_valid_to_sell: false,
      },
      onclose: [], /* cleanup callback array when dialog is closed */
   };

   if(Lookback.isLookback(proposal.contract_type)) {
     [state.table.barrier_label, state.table.low_barrier_label] = Lookback.barrierLabels(proposal.contract_type);
   }

   get_chart_data(state, root);
   return state;
};

const update_live_chart = (state, granularity) => {
  const key = chartingRequestMap.keyFor(state.chart.symbol, granularity);
  handle_chartingRequestMap(key);

  let on_tick_cb = undefined;
  let on_candles_cb = undefined;
  let clean_up_done = false;
  state.onclose.push(clean_up);

  if (granularity === 0) {
    handle_tick();
    return;
  }
  handle_candle();

  /* don't register if already someone else has registered for this symbol */
  function handle_chartingRequestMap() {
    if(!chartingRequestMap[key]){
      const req = make_chartingRequestMap_request(granularity, state.chart.symbol);
      chartingRequestMap.register(req)
          .catch((err) => {
            $.growl.error({ message: err.message });
            console.error(err);
          });
    } else {
      chartingRequestMap.subscribe(key);
    }
  };

  function make_chartingRequestMap_request(granularity, symbol) {
    return ({
      symbol,
      subscribe: 1,
      granularity,
      style: granularity === 0 ? 'ticks' : 'candles',
    });
  };

  function handle_tick() {
    on_tick_cb = liveapi.events.on('tick', (data) => {
        if (!data.tick || data.tick.symbol !== state.chart.symbol) return;

        const { chart } = state.chart;
        const { status } = state.proposal_open_contract;
        const { tick } = data;

        const contract_has_finished = !!state.table.is_sold || status !== 'open';
        if (contract_has_finished) {
          clean_up();
          return;
        };

        add_tick_to_chart(chart, tick);
    });

    function add_tick_to_chart(chart, tick) {
      if (!chart) return;
      chart.series[0].addPoint([tick.epoch * 1000, tick.quote * 1]);
    }
  };

  function handle_candle() {
    on_candles_cb = liveapi.events.on('ohlc', (data) => {
      const data_key = chartingRequestMap.keyFor(data.ohlc.symbol, data.ohlc.granularity);
      if (key !== data_key) return;

      const { chart } = state.chart;
      if (!chart) return;

      const series = chart.series[0];
      const last = series.data[series.data.length - 1];

      const c = data.ohlc;
      const ohlc = [c.open_time * 1000, c.open * 1, c.high * 1, c.low * 1, c.close * 1];

      if (last.x !== ohlc[0]) {
          series.addPoint(ohlc, true, true);
      } else {
        last.update(ohlc,true);
      }

      const contract_has_finished = c.epoch * 1 > state.proposal_open_contract.date_expiry * 1;
      if (contract_has_finished) clean_up();
    });
  };

  function clean_up() {
    if (clean_up_done) return;
    clean_up_done = true;

    chartingRequestMap.unregister(key);
    on_tick_cb && liveapi.events.off('tick', on_tick_cb);
    on_candles_cb && liveapi.events.off('candles', on_candles_cb);
  };
};

const draw_barrier = (state, contract = {}) => {
  // TODO: move chart check one step up, pass down barrriers
  const { chart } = state.chart;
  if (!chart) return;

  add_barriers_to_chart();

  function add_barriers_to_chart() {
    const { barrier, high_barrier, low_barrier } = state.proposal_open_contract;

    remove_barriers(barrier, high_barrier, low_barrier);

    if (barrier) {
      const barrier_label = `${state.table.barrier_label || 'Barrier'.i18n()} ( ${addComma((+barrier).toFixed(display_decimals))} )`;
      add_plot_line_y('barrier', barrier, barrier_label);
    }
    if (high_barrier) {
      const high_barrier_label = `${state.table.barrier_label || 'High Barrier'.i18n()} ( ${addComma((+high_barrier).toFixed(display_decimals))} )`;
      add_plot_line_y('high_barrier', high_barrier, high_barrier_label);
    }
    if (low_barrier){
      const low_barrier_label = `${state.table.low_barrier_label || 'Low Barrier'.i18n()} ( ${addComma((+low_barrier).toFixed(display_decimals))} )`;
      add_plot_line_y('low_barrier', low_barrier, low_barrier_label, 'red');
    }

    function add_plot_line_y(id, value, label, color) {
      chart.addPlotLineY({ id, value, label, color });
    };
  };

  function remove_barriers(barrier, high_barrier, low_barrier) {
    barrier && chart.yAxis[0].removePlotLine('barrier');
    high_barrier && chart.yAxis[0].removePlotLine('high_barrier');
    low_barrier && chart.yAxis[0].removePlotLine('low_barrier');
  };
}

const get_chart_data = (state, root) => {
  const duration = Math.min(state.proposal_open_contract.date_expiry * 1, moment.utc().unix()) - (state.table.purchase_time || state.proposal_open_contract.date_start);

  const granularity = make_granularity(duration);
  const margin = make_time_margin(duration, granularity);
  const tick_history_request = make_tick_history_request(granularity, margin);

   if (!state.proposal_open_contract.is_ended) {
      update_live_chart(state, granularity);
   }

  return liveapi.send(tick_history_request).then((data) => {
      on_tick_history_success(data);
    })
    .catch((err) => {
      on_tick_history_error(err);
    });

  function make_granularity(duration) {
    let granularity = 0;

    if (duration <= 60 * 60) { granularity = 0; } // 1 hour
    else if (duration <= 2 * 60 * 60) { granularity = 60; } // 2 hours
    else if (duration <= 6 * 60 * 60) { granularity = 120; } // 6 hours
    else if (duration <= 24 * 60 * 60) { granularity = 300; } // 1 day
    else { granularity = 3600 } // more than 1 day
    return granularity;
  };

  function make_time_margin(duration, granularity) {
    let margin = 0;
    margin = granularity === 0 ? Math.max(3, 30 * duration / (60 * 60) | 0) : 3 * granularity;
    return margin;
  };

  function make_tick_history_request(granularity, margin) {
    const request = {
      ticks_history: state.chart.symbol,
      start: (state.table.purchase_time || state.proposal_open_contract.date_start) * 1 - margin, /* load around 2 more thicks before start */
      end: state.table.sell_time ? state.table.sell_time * 1 + margin : state.proposal_open_contract.exit_tick_time ? state.proposal_open_contract.exit_tick_time * 1 + margin : 'latest',
      style: 'ticks',
      count: 4999, /* maximum number of ticks possible */
    };

    if (granularity !== 0) {
      request.granularity = granularity;
      request.style = 'candles';
      state.chart.type = 'candles';
    }
    return request;
  };


  function on_tick_history_success(data) {
    state.chart.loading = '';

    const chart_options = make_chart_options(data, state.chart.display_name);
    const chart = init_chart(root, state, chart_options);
    state.chart.chart = chart;
    state.chart.manual_reflow();

    function make_chart_options(data, title) {
      return ({ title, ...data });
    };
  };

  function on_tick_history_error(err) {
    state.chart.loading = err.message;
    console.error(err);
  };
};

export default  { init };
