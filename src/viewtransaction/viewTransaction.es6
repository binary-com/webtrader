import $ from 'jquery';
import windows from 'windows/windows';
import liveapi from 'websockets/binary_websockets';
import chartingRequestMap from 'charts/chartingRequestMap';
import rv from 'common/rivetsExtra';
import moment from 'moment';
import 'common/util';
import * as ChartSettings from '../charts/chartSettings';
import Lookback from 'trade/lookback';
require(['css!viewtransaction/viewTransaction.css']);
require(['text!viewtransaction/viewTransaction.html']);

const open_dialogs = {};
const NOTE_TEXT = {
  EXPIRED: 'This contract has expired'.i18n(),
  MARKET_RATE: 'Note: Contract will be sold at the prevailing market price when the request is received by our servers. This price may differ from the indicated price.'.i18n(),
  NO_RESALE: 'Resale of this contract is not offered'.i18n(),
  FINISHED: 'This contract has expired'.i18n(),
};

let market_data_disruption_win = null;
const showMarketDataDisruptionWindow = () => {
   if (market_data_disruption_win) {
      market_data_disruption_win.moveToTop();
      return;
   }
   const market_disrupt_msg = 'There was a market data disruption during the contract period. For real-money accounts we will attempt to correct this and settle the contract properly, otherwise the contract will be cancelled and refunded. Virtual-money contracts will be cancelled and refunded.'.i18n();
   const root = $('<div class="data-disruption-dialog">' + market_disrupt_msg + '</div>');

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
};

const initChart = (root, state, options) => {
   let data = [];
   let type = '';
   let display_decimals = 3;

   if (options.history) {
      type = 'line';
      const { history } = options;
      const { times, prices } = history;

      for (let i = 0; i < times.length; ++i) {
         data.push([times[i] * 1000, prices[i] * 1]);
         display_decimals = Math.max(display_decimals, prices[i].toString().substring(prices[i].toString().indexOf('.') + 1).length);
      }
   }

   if (options.candles) {
      type = 'candlestick';
      data = options.candles.map((c) => [c.epoch * 1000, c.open * 1, c.high * 1, c.low * 1, c.close * 1]);
   }

   const { title } = options;
   const el = root.find('.transaction-chart')[0];
   const CHART_LABELS = ChartSettings.getChartLabels(state.proposal_open_contract);
   const { entry_tick_time, date_start } = state.proposal_open_contract;
   const zone_start = entry_tick_time || date_start;

   const chart_options = {
      credits: { href: '#', text: '' },
      chart: {
         type: 'line',
         renderTo: el,
         backgroundColor: null, /* make background transparent */
         width: 0,
         height: 0,
         marginLeft: 65,
         marginRight:20
      },
      title: { text: '' },
      subtitle: {
        text: ChartSettings.getLabelEl(CHART_LABELS),
        useHTML: true,
      },
      tooltip: {
         useHTML: true,
         formatter() {
            const spot = addComma(this.y, display_decimals);
            const spot_time = moment.utc(this.x).format('dddd, MMM D, HH:mm:ss');
            return `<div class='tooltip-body'>${spot_time} GMT<br/>${this.series.name} ${spot}</div>`;
        },
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
          x: -65,
          y: -2,
          formatter() {
            return addComma(this.value, display_decimals);
          },
        },
         title: '',
      },
      series: [{
         name: title,
         data: data,
         type: type,
         zIndex: 10,
         zoneAxis: 'x',
         // zones are used to display color of the line
         zones:[{
             // make the line grey until it reaches entry time or zone_start time if entry spot time is not yet known
             value: zone_start ? +zone_start * 1000 : '',
             color: '#ccc',
         }, {
             // make the line default color until exit time is reached
             color: '',
         }, {
             // make the line grey again after trade ended
             color: '#ccc',
         }],
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
         color: options.color || '#e98024',
         zIndex: 0,
         width: options.width || 2,
         dashStyle: options.dashStyle,
      });
   };

   chart.addPlotLineY = (options) => {
      chart.yAxis[0].addPlotLine({
         id: options.id,
         value: options.value,
         color: options.color || 'green',
         zIndex: 0,
         width: 2,
         dashStyle: options.dashStyle,
      });
   };
   return el.chart = chart;
};

export const init = (contract_id, transaction_id) => {
   return new Promise((resolve, reject) => {
      if (open_dialogs[transaction_id]) {
         open_dialogs[transaction_id].moveToTop();
         resolve();
         return;
      }
      liveapi.send({proposal_open_contract: 1, contract_id})
        .then((data) => {
            const proposal = data.proposal_open_contract;
            /* check for market data disruption error */
            if (proposal.underlying === undefined && proposal.shortcode === undefined) {
               showMarketDataDisruptionWindow(proposal);
               return;
            }
            proposal.transaction_id = transaction_id;
            init_dialog(proposal);
            resolve();
         })
         .catch((err) => {
            console.error(err);
            reject(err);
         });
   });
};

const handleError = (message) => {
  $.growl.error({ message });
  liveapi.proposal_open_contract.forget(data.echo_req.contract_id);
  liveapi.proposal_open_contract.subscribe(data.echo_req.contract_id);
};

const updateIndicative = (data, state) => {
  const contract = data.proposal_open_contract;
  updateState(contract, state);
  drawChart(contract, state);

  const contract_has_finished = contract.status !== 'open';
  if (contract_has_finished) {
    onContractFinished(state);
    return;
  }

  updateStateSell();
  handleForwardStarting();
  state.chart.manualReflow();

  function updateState(contract, state) {
    const sell_time = contract.is_path_dependent && contract.status !== 'sold' ? contract.exit_tick_time : parseInt(contract.sell_time);
    const pip_value = getSymbolPipValue(contract.underlying);

    // note: cannot use spread operator - rivets.js 2-way data-binding breaks if new object
    state.proposal_open_contract.pip = pip_value;
    state.proposal_open_contract.is_sold_before_expiry = sell_time < contract.date_expiry;
    state.proposal_open_contract.current_spot = contract.current_spot;
    state.proposal_open_contract.current_spot_time = contract.current_spot_time;
    state.proposal_open_contract.bid_price = contract.bid_price;
    state.proposal_open_contract.entry_tick = contract.entry_tick;
    state.proposal_open_contract.entry_tick_time = contract.entry_tick_time;
    state.proposal_open_contract.status = contract.status;
    state.proposal_open_contract.is_sold = contract.is_sold;
    state.proposal_open_contract.exit_tick = contract.exit_tick;
    state.proposal_open_contract.exit_tick_time = contract.exit_tick_time;
    state.proposal_open_contract.date_expiry = contract.date_expiry;
    state.proposal_open_contract.sell_price = contract.sell_price;
    state.proposal_open_contract.is_valid_to_sell = contract.is_valid_to_sell;
    state.proposal_open_contract.barrier = contract.barrier;
    state.proposal_open_contract.high_barrier = contract.high_barrier;
    state.proposal_open_contract.low_barrier = contract.low_barrier;

    state.note = makeNote(contract);
  }

  function updateStateSell() {
    if (contract.bid_price) {
      state.sell.bid_price.value = contract.bid_price;
      [state.sell.bid_price.unit, state.sell.bid_price.cent] = contract.bid_price.toString().split(/[\.,]+/);
    }
  }

  function handleForwardStarting() {
    const constract_is_forward_starting = contract.is_forward_starting && +contract.date_start > +contract.current_spot_time;
    if (constract_is_forward_starting) {
      state.fwd_starting = '* Contract has not started yet'.i18n();
      return;
    }
    state.fwd_starting = '';
  }
};

function drawChart(contract, state) {
  drawSparkline(contract, state);

  const { chart } = state.chart;
  if (!chart) return;

  drawSpots(contract, state, chart);
  drawXLines(contract, state, chart);
  drawBarriers(contract, state);
  drawZones(contract, state, chart);
}

function drawZones(contract, state, chart) {
  const { entry_tick_time, exit_tick_time, date_expiry, sell_time } = contract;
  const { is_sold_before_expiry } = state.proposal_open_contract;

  drawZone({ spot_time: entry_tick_time, label: 'entry_zone', zone_idx: 0 });

  if (is_sold_before_expiry) {
    drawZone({ spot_time: exit_tick_time || sell_time, label: 'exit_zone', zone_idx: 1 });
  }
  drawZone({ spot_time: exit_tick_time || date_expiry, label: 'exit_zone', zone_idx: 1 });

  function drawZone({spot_time, label, zone_idx}) {
    if (!spot_time || state.chart.hasLabel(label)) return;

    chart.series[0].zones[zone_idx].value = (+spot_time * 1000);
  }
}

function drawSpots(contract, state, chart) {
  const { entry_tick_time, exit_tick_time, tick_count, is_path_dependent } = contract;
  const { is_sold_before_expiry } = state.proposal_open_contract;

  if (tick_count) return; // tick contracts = chart should not have entry/exit spots

  if (entry_tick_time) {
    drawSpot({ spot_time: entry_tick_time, label: 'entry_tick_time', color: 'white' });
  }

  if (is_path_dependent && exit_tick_time) {
    drawSpot({ spot_time: exit_tick_time, label: 'exit_tick_time', color: 'orange' });
  }

  if (!is_sold_before_expiry) drawSpot({ spot_time: exit_tick_time, label: 'exit_tick_time', color: 'orange' });

  function drawSpot({ spot_time, label, color }) {
    if (!spot_time || state.chart.hasLabel(label)) return;

    const series_spot = chart.series[0].data.find((marker) => +marker.x === (+spot_time * 1000));
    if (!series_spot) return;

    const marker = ChartSettings.getMarkerSettings(color);
    series_spot.update({ marker });
  }
}

function drawXLines(contract, state, chart) {
  const { entry_tick_time, exit_tick_time, date_start, date_expiry, tick_count, sell_time } = contract;

  if (tick_count) { // only for tick contracts
    drawXLine({ line_time: entry_tick_time, label: 'start_time' });
    drawXLine({ line_time: exit_tick_time, label: 'end_time', dashStyle: 'Dash' });
    return;
  }

  drawXLine({ line_time: date_start, label: 'start_time' });
  drawEndTime(contract);
  drawPurchaseTime(contract);

  function drawXLine({ line_time, label, dashStyle, color }) {
    if (!line_time || state.chart.hasLabel(label)) return false;

    chart.addPlotLineX({ value: +line_time * 1000, dashStyle, color});
  }

  function drawEndTime({ is_path_dependent }) {
    const { is_sold_before_expiry } = state.proposal_open_contract;

    if (is_path_dependent && exit_tick_time && is_sold_before_expiry) {
      drawXLine({ line_time: exit_tick_time, label: 'end_time', dashStyle: 'Dash' });
    }

    if (is_sold_before_expiry) drawXLine({ line_time: sell_time, label: 'end_time', dashStyle: 'Dash' });
    if (!is_path_dependent) drawXLine({ line_time: date_expiry, label: 'end_time', dashStyle: 'Dash' });
  }

  function drawPurchaseTime({ purchase_time }) {
    if (date_start > purchase_time) {
      drawXLine({ line_time: purchase_time, label: 'purchase_time', color:'#7cb5ec' });
    }
  }
}

const onContractFinished = (state) => {
  state.proposal_open_contract.is_ended = true;
  state.sell.sell_at_market_enabled = false;
};

const makeNote = (contract) => {
    if (contract.validation_error) return contract.validation_error;
    if (contract.status !== 'open') return NOTE_TEXT.FINISHED;
    if (contract.is_expired || contract.is_sold) return NOTE_TEXT.EXPIRED;
    if (contract.is_valid_to_sell) return NOTE_TEXT.MARKET_RATE;
    if (!contract.is_valid_to_sell) return NOTE_TEXT.NO_RESALE;
};

const drawSparkline = (contract, state) => {
  if (state.sell.bid_prices.length > 40) state.sell.bid_prices.shift();

  state.sell.bid_prices.push(contract.bid_price);
};

const init_dialog = (proposal) => {
   require(['text!viewtransaction/viewTransaction.html'], (html) => {
      const root = $(html).i18n();
      const state = initState(proposal, root);

      const transWin = windows.createBlankWindow(root, {
         title: proposal.display_name + ' (' + proposal.transaction_id + ')',
         width: 700,
         minWidth: 630,
         minHeight: 480,
         height: 480,
         destroy: () => {},
         close: function() {
            view && view.unbind();
            liveapi.proposal_open_contract.forget(proposal.contract_id);
            liveapi.events.off('proposal_open_contract', on_proposal_open_contract_cb);
            for(let i = 0; i < state.onclose.length; ++i)
               state.onclose[i]();
            $(this).dialog('destroy').remove();
            open_dialogs[proposal.transaction_id] = undefined;
         },
         open: () => {
          liveapi.proposal_open_contract.forget(proposal.contract_id);
         },
         resize: () => {
            state.chart.manualReflow();
         },
         'data-authorized': 'true'
      });

      transWin.dialog('open');
      const view = rv.bind(root[0], state);
      open_dialogs[proposal.transaction_id] = transWin;
   });
};

const sellAtMarket = (state, root) => {
   state.sell.sell_at_market_enabled = false;
   require(['text!viewtransaction/viewTransactionConfirm.html', 'css!viewtransaction/viewTransactionConfirm.css']);
   liveapi.send({ sell: state.proposal_open_contract.contract_id, price: 0 })
      .then((data) => {
         state.proposal_open_contract.is_sold_before_expiry = true;
         const { sell } = data;
         require(['text!viewtransaction/viewTransactionConfirm.html', 'css!viewtransaction/viewTransactionConfirm.css'],
            (html) => {
               const { buy_price, longcode, currency } = state.proposal_open_contract;
               const state_confirm = {
                  longcode,
                  buy_price,
                  sell_price: sell.sold_for,
                  return_percent: (100 * (sell.sold_for - buy_price) / buy_price).toFixed(2) + '%',
                  transaction_id: sell.transaction_id,
                  balance: sell.balance_after,
                  currency,
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

const initState = (proposal, root) => {
   const sell_time = proposal.is_path_dependent && proposal.status !== 'sold' ? proposal.exit_tick_time : parseInt(proposal.sell_time);

   const state = {
      route: {
         value: 'table',
         update: (value) => { state.route.value = value; },
      },
      note: makeNote(proposal),
      chart: {
         chart: null, /* highchart object */
         loading: 'Loading ' + proposal.display_name + ' ...',
         added_labels: [],
         hasLabel: (label) => {
          if (state.chart.added_labels.includes(label)) return true;

          state.chart.added_labels.push(label);
          return false;
         },
         type: 'ticks', // could be 'tick' or 'ohlc'
         manualReflow: () => {
          if (!state.chart.chart) return;

          const h = -1 * (root.find('.longcode').height() + root.find('.tabs').height() + root.find('.footer').height()) - 16;
          const container = root;
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
        currency: (proposal.currency ||  'USD') + ' ',
        is_ended: proposal.is_settleable || proposal.is_sold || proposal.status !== 'open',
        is_sold_at_market: false,
        is_sold_before_expiry: sell_time < proposal.date_expiry,
        isLookback: Lookback.isLookback(proposal.contract_type),
        lb_formula: Lookback.formula(proposal.contract_type, proposal.multiplier && formatPrice(proposal.multiplier, proposal.currency ||  'USD')),
        pip: 0,
      },
      sell: {
         bid_prices: [],
         bid_price: {
            unit: undefined,
            cent: undefined,
            value: undefined,
         },
         sell: () => sellAtMarket(state, root),
         sell_at_market_enabled: true,
      },
      onclose: [], /* cleanup callback array when dialog is closed */
   };
   setupChart(state, root);
   return state;
};

let on_proposal_open_contract_cb;
function getContractData(state, proposal) {
  on_proposal_open_contract_cb = onProposalOpenContract;

  liveapi.proposal_open_contract.subscribe(proposal.contract_id)
  liveapi.events.on('proposal_open_contract', on_proposal_open_contract_cb);

  function onProposalOpenContract(data) {
    const is_different_stream = +data.proposal_open_contract.contract_id !== +state.proposal_open_contract.contract_id;
    if (is_different_stream) return;

    if (data.error) {
      handleError(data.error.message);
      return;
    }
    updateIndicative(data, state);
  }
}

const updateLiveChart = (state, granularity) => {
  const key = chartingRequestMap.keyFor(state.proposal_open_contract.underlying, granularity);
  handleChartingRequestMap(key);

  let on_tick_cb = undefined;
  let on_candles_cb = undefined;
  let clean_up_done = false;
  state.onclose.push(cleanUp);

  if (granularity === 0) {
    handleTick();
    return;
  }
  handleCandle();

  /* don't register if already someone else has registered for this symbol */
  function handleChartingRequestMap() {
    if(!chartingRequestMap[key]){
      const req = makeChartingRequestMapRequest(granularity, state.proposal_open_contract.underlying);
      chartingRequestMap.register(req)
          .catch((err) => {
            $.growl.error({ message: err.message });
            console.error(err);
          });
    } else {
      chartingRequestMap.subscribe(key);
    }
  }

  function makeChartingRequestMapRequest(granularity, symbol) {
    return ({
      symbol,
      subscribe: 1,
      granularity,
      style: granularity === 0 ? 'ticks' : 'candles',
    });
  }

  function handleTick() {
    on_tick_cb = liveapi.events.on('tick', (data) => {
        if (!data.tick || data.tick.symbol !== state.proposal_open_contract.underlying) return;

        const { chart } = state.chart;
        const { status, is_sold, exit_tick, exit_tick_time } = state.proposal_open_contract;
        const { tick } = data;

        const contract_has_finished = is_sold || status !== 'open' || exit_tick || exit_tick_time;
        if (contract_has_finished) {
          cleanUp();
          return;
        };

        addTickToChart(chart, tick);
    });

    function addTickToChart(chart, tick) {
      if (!chart) return;
      chart.series[0].addPoint([tick.epoch * 1000, tick.quote * 1, 'gray']);
    }
  }

  function handleCandle() {
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
      const { status, is_sold, exit_tick, exit_tick_time, date_expiry} = state.proposal_open_contract;
      const contract_has_finished = (c.epoch * 1 > date_expiry * 1) || status !== 'open' || exit_tick || exit_tick_time;

      if (contract_has_finished) cleanUp();
    });
  }

  function cleanUp() {
    if (clean_up_done) return;
    clean_up_done = true;

    chartingRequestMap.unregister(key);
    on_tick_cb && liveapi.events.off('tick', on_tick_cb);
    on_candles_cb && liveapi.events.off('candles', on_candles_cb);
  }
};

const drawBarriers = (contract, state) => {
  const { chart } = state.chart;
  const { barrier, high_barrier, low_barrier, tick_count } = state.proposal_open_contract;

  removeBarriers(barrier, high_barrier, low_barrier);
  addBarrierToChart(barrier, high_barrier, low_barrier);

  function addBarrierToChart(barrier, high_barrier, low_barrier) {
    const dashStyle = tick_count ? '' : 'dot';

    if (barrier)  chart.addPlotLineY({ id: 'barrier', value: barrier, dashStyle })
    if (high_barrier) chart.addPlotLineY({ id: 'high_barrier', value: high_barrier, dashStyle })
    if (low_barrier) chart.addPlotLineY({ id: 'low_barrier', value: low_barrier, dashStyle })
  }

  function removeBarriers(barrier, high_barrier, low_barrier) {
    if (barrier) chart.yAxis[0].removePlotLine('barrier');
    if (high_barrier) chart.yAxis[0].removePlotLine('high_barrier');
    if (low_barrier) chart.yAxis[0].removePlotLine('low_barrier');
  }
}

const setupChart = (state, root) => {
  const duration = Math.min(+state.proposal_open_contract.date_expiry, moment.utc().unix()) - (state.proposal_open_contract.purchase_time || state.proposal_open_contract.date_start);
  const granularity = makeGranularity(duration);
  const margin = makeTimeMargin(duration, granularity);
  const tick_history_request = makeTickHistoryRequest(granularity, margin);

  // setup tick/candle stream for chart
  if (!state.proposal_open_contract.is_ended) updateLiveChart(state, granularity);

  liveapi.send(tick_history_request)
    .then((data) => {
      onTickHistorySuccess(data);
      getContractData(state, state.proposal_open_contract);
    }).catch((err) => {
      onTickHistoryError(err);
  });

  function makeGranularity(duration) {
    let granularity = 0;

    if (duration <= 60 * 60) { granularity = 0; } // 1 hour
    else if (duration <= 2 * 60 * 60) { granularity = 60; } // 2 hours
    else if (duration <= 6 * 60 * 60) { granularity = 120; } // 6 hours
    else if (duration <= 24 * 60 * 60) { granularity = 300; } // 1 day
    else { granularity = 3600 } // more than 1 day
    return granularity;
  }

  function makeTimeMargin(duration, granularity) {
    let margin = 0;
    margin = (granularity === 0) ? Math.max(3, 30 * duration / (60 * 60) | 0) : 3 * granularity;
    return margin;
  }

  function makeTickHistoryRequest(granularity, margin) {
    const { date_start, current_spot_time, purchase_time, exit_tick_time } = state.proposal_open_contract;
    const is_forward_starting = +date_start > +purchase_time;
    let start;

    if (is_forward_starting) {
      start = purchase_time;
    } else {
      const contract_has_not_started = (+date_start > +current_spot_time) || +exit_tick_time < +date_start;
      start = contract_has_not_started ? +purchase_time : (+date_start || +purchase_time);
    }
    const end = ((start > exit_tick_time) || !exit_tick_time) ? 'latest' : +exit_tick_time + margin;

    const request = {
      adjust_start_time: 1,
      ticks_history: state.proposal_open_contract.underlying,
      start: start - margin, /* load around 2 more ticks before start */
      end,
      style: 'ticks',
      count: 4999, /* maximum number of ticks possible */
    };

    if (granularity !== 0) {
      request.granularity = granularity;
      request.style = 'candles';
      state.chart.type = 'candles';
    }
    return request;
  }


  function onTickHistorySuccess(data) {
    state.chart.loading = '';
    const chart_options = makeChartOptions(data, state.proposal_open_contract.display_name);
    const chart = initChart(root, state, chart_options);
    state.chart.chart = chart;
    state.chart.manualReflow();

    function makeChartOptions(data, title) {
      return ({ title, ...data });
    }
  }

  function onTickHistoryError(err) {
    state.chart.loading = err.message;
    console.error(err);
  }
};

export default  { init };
