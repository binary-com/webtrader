﻿/**
 * Created by amin on January 14, 2016.
 */

define(["jquery", "windows/windows", "websockets/binary_websockets", "portfolio/portfolio", "charts/chartingRequestMap", "common/rivetsExtra", "moment", "lodash", "jquery-growl", 'common/util'],
  function($, windows, liveapi, portfolio, chartingRequestMap, rv, moment, _) {
  'use strict';

  var open_dialogs = {};

  require(['css!viewtransaction/viewTransaction.css']);
  require(['text!viewtransaction/viewTransaction.html']);

  function init_chart(root, options) {
      var data = [];
      var type = '';
      if(options.history){
        type = 'line';
        var history = options.history;
        var times = history.times;
        var prices = history.prices;
        for(var i = 0; i < times.length; ++i) {
          data.push([times[i]*1000, prices[i]*1]);
        }
      }
      if(options.candles) {
        type = 'candlestick';
        data = options.candles.map(function(c){
          return [c.epoch*1000, c.open*1, c.high*1, c.low*1, c.close*1];
        })
      }
      var title = options.title;
      var el = root.find('.transaction-chart')[0];

      var options = {
        credits: { href: 'https://www.binary.com', text: 'Binary.com' },
        chart: {
          type: 'line',
          renderTo: el,
          backgroundColor: null, /* make background transparent */
          width: 0,
          height: 0,
          events: {
              load: function() {
                  this.credits.element.onclick = function() {
                      window.open( 'https://www.binary.com', '_blank' );
                  }
              }
          }
        },
        title:{
          text: title,
          style: { fontSize:'16px' }
        },
        tooltip:{ xDateFormat:'%A, %b %e, %H:%M:%S GMT' },
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
          type: type,
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
      var chart = new Highcharts.Chart(options);

      chart.addPlotLineX = function(options) {
        chart.xAxis[0].addPlotLine({
           value: options.value,
           id: options.id || options.value,
           label: {text: options.label || 'label', x: options.text_left ? -15 : 5},
           color: options.color || '#e98024',
           zIndex: 4,
           width: options.width || 2,
        });
      };

      chart.addPlotLineY = function(options) {
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

  /* returns a promise */
  function get_symbol_name(symbol){
    return liveapi.cached.send({trading_times: new Date().toISOString().slice(0, 10)})
                  .then(function(data){
                    var markets = data.trading_times.markets;
                    for(var i  = 0; i < markets.length; ++i)
                      for(var smarket = markets[i].submarkets, j = 0; j < smarket.length; ++j)
                        for(var symbols = smarket[j].symbols, k = 0; k < symbols.length; ++k)
                          if(symbols[k].symbol === symbol)
                            return symbols[k].name;
                    return 'Transaction';
                  });
  }
  /* get the tick value for a given epoch */
  function get_tick_value(symbol, epoch){
    console.log('get_tick_value');
    return liveapi.send({ticks_history: symbol, granularity: 0, style:'ticks', start: epoch, end:epoch+2, count: 1})
                  .catch(function(err) { console.error(err); });
  }
  /* websocket is not returning purchase_time, query portfolio to find this field */
  function get_purchase_time(proposal) {
      return new Promise(function(resolve, reject){
        if(!proposal.is_forward_starting || moment.utc().unix() > proposal.date_start*1) {
          resolve(undefined);
          return;
        }

        liveapi.send({portfolio: 1})
           .then(function(data){
              var contracts = data.portfolio.contracts;
              var contract = contracts.filter(function(c) { return c.contract_id === proposal.contract_id;})[0];
              resolve(contract && contract.purchase_time); /* if not found, purchase_time is undefined */
           }).catch(function(err){
             console.error(err);
             resolve(undefined);
           });
      })
  }

  function init(contract_id, transaction_id){
    return new Promise(function(resolve, reject){
      if(open_dialogs[transaction_id]) {
        open_dialogs[transaction_id].moveToTop();
        resolve();
        return;
      }
      liveapi.send({proposal_open_contract: 1, contract_id: contract_id})
           .then(function(data){
              var proposal = data.proposal_open_contract;
              proposal.transaction_id = transaction_id;
              proposal.symbol = proposal.underlying;
              get_symbol_name(proposal.symbol).then(function(symbol_name){
                proposal.symbol_name = symbol_name;
                init_dialog(proposal);
                resolve();
              }).catch(function(err) { console.error(err); reject(); })
           })
           .catch(function(err){
             console.error(err);
             $.growl.error({ message: err.message });
             reject();
           });
    });
  }

  function update_indicative(data, state){
      var contract = data.proposal_open_contract;
      var id = contract.contract_id,
          bid_price = contract.bid_price;
      if(id !== state.contract_id) { return; }

      /* fix for backend wrong is_valid_to_sell field :( */
      if(state.is_sold_at_market) {
        contract.is_expired = 1;
        contract.is_valid_to_sell = 0;
      }
      if(contract.is_expired)
        contract.is_valid_to_sell = 0;

      if(contract.validation_error)
        state.validation = contract.validation_error;
      else if(contract.is_expired)
        state.validation = 'This contract has expired';
      else if(contract.is_valid_to_sell)
        state.validation = 'Note: Contract will be sold at the prevailing market price when the request is received by our servers. This price may differ from the indicated price.';

      /*Do not update the current_spot and current_spot_time if the contract has expired*/
      if(state.table.date_expiry*1 >= contract.current_spot_time*1) {
          state.table.current_spot = contract.current_spot;
          state.table.current_spot_time = contract.current_spot_time;
          state.table.bid_price = contract.bid_price;
          if(state.sell.bid_prices.length > 40) {
              state.sell.bid_prices.shift();
          }
          state.sell.bid_prices.push(contract.bid_price)

          state.sell.bid_price.value = contract.bid_price;
          state.sell.bid_price.unit = contract.bid_price.split(/[\.,]+/)[0];
          state.sell.bid_price.cent = contract.bid_price.split(/[\.,]+/)[1];
          state.sell.is_valid_to_sell = false;
          state.sell.is_valid_to_sell = contract.is_valid_to_sell;
          state.chart.manual_reflow();
      } else {
          /*Just change the current_spot_time to date_expiry*/
          state.table.current_spot_time = state.table.date_expiry;
      }

  }

  function init_dialog(proposal) {
    require(['text!viewtransaction/viewTransaction.html'],function(html) {
        var root = $(html);
        var state = init_state(proposal, root);
        var on_proposal_open_contract = function(data) {
            console.log('on_proposal_open_contract');
            update_indicative(data, state);
        };

        var transWin = windows.createBlankWindow(root, {
            title: proposal.symbol_name + ' (' + proposal.transaction_id + ')',
            width: 700,
            minWidth: 490,
            minHeight:370,
            destroy: function() { },
            close: function() {
              view && view.unbind();
              portfolio.proposal_open_contract.forget();
              liveapi.events.off('proposal_open_contract', on_proposal_open_contract);
              for(var i = 0; i < state.onclose.length; ++i)
                state.onclose[i]();
              $(this).dialog('destroy').remove();
              open_dialogs[proposal.transaction_id] = undefined;
            },
            open: function() {
              portfolio.proposal_open_contract.subscribe();
              liveapi.events.on('proposal_open_contract', on_proposal_open_contract);
            },
            resize: function() {
              state.chart.manual_reflow();
              // state.chart.chart && state.chart.chart.reflow();
            },
            'data-authorized': 'true'
        });

        transWin.dialog('open');
        var view = rv.bind(root[0],state)
        open_dialogs[proposal.transaction_id] = transWin;
    });
  }

  function sell_at_market(state, root) {
    state.sell.sell_at_market_enabled = false; /* disable button */
    require(['text!viewtransaction/viewTransactionConfirm.html', 'css!viewtransaction/viewTransactionConfirm.css']);
    liveapi.send({sell: state.contract_id, price: 0 /* to sell at market */})
          .then(function(data){
              var sell = data.sell;
              require(['text!viewtransaction/viewTransactionConfirm.html', 'css!viewtransaction/viewTransactionConfirm.css'], function(html){
                  var buy_price = state.table.buy_price;
                  var state_confirm = {
                    longcode: state.longcode,
                    buy_price: buy_price,
                    sell_price: sell.sold_for,
                    return_percent: (100*(sell.sold_for - buy_price)/buy_price).toFixed(2)+'%',
                    transaction_id: sell.transaction_id,
                    balance: sell.balance_after,
                    currency: state.table.currency,
                  };
                  var $html = $(html);
                  root.after($html);
                  var view_confirm = rv.bind($html[0], state_confirm);
                  state.onclose.push(function(){
                    view_confirm && view_confirm.unbind();
                  });
              });
          })
          .catch(function(err){
              $.growl.error({ message: err.message });
              console.error(err);
          });
  }

  function init_state(proposal, root){
      var state = {
          route: {
              value: 'table',
              update: function(value) { state.route.value = value; }
          },
          contract_id: proposal.contract_id,
          longcode: proposal.longcode,
          validation: proposal.validation_error
                || (!proposal.is_valid_to_sell && 'Resale of this contract is not offered')
                || (proposal.is_expired && 'This contract has expired') || '-',
          table: {
            is_expired: proposal.is_expired,
            currency: (proposal.currency ||  'USD') + ' ',
            current_spot_time: undefined,
            current_spot: undefined,
            date_start: proposal.date_start,
            date_expiry: proposal.date_expiry,

            entry_tick: proposal.entry_tick || proposal.entry_spot,
            entry_tick_time: proposal.entry_tick_time,
            exit_tick: proposal.exit_tick,
            exit_tick_time: proposal.exit_tick_time,

            buy_price: proposal.buy_price && formatPrice(proposal.buy_price),
            bid_price: undefined,
            final_price: proposal.sell_price && formatPrice(proposal.sell_price),

            tick_count: proposal.tick_count,
            prediction: proposal.prediction,

            sell_time: undefined,
            sell_spot: undefined,
            sell_price: undefined,
            purchase_time: undefined,
            is_sold_at_market: false,
          },
          chart: {
            chart: null, /* highchart object */
            symbol: proposal.symbol,
            symbol_name: proposal.symbol_name,
            barrier: proposal.barrier,
            high_barrier: proposal.high_barrier,
            low_barrier: proposal.low_barrier,
            loading: 'Loading ' + proposal.symbol_name + ' ...',
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

      state.sell.sell = function() { sell_at_market(state, root); }

      state.chart.manual_reflow = function() {
        /* TODO: find a better solution for resizing the chart  :/ */
        var h = -1 * (root.find('.longcode').height() + root.find('.tabs').height() + root.find('.footer').height()) - 16;
        if(!state.chart.chart) return;
        var container = root;// root.find('.chart-container');
        var transactionChart = container.find(".transaction-chart");
        var width = container.width() - 30, height = container.height();
        state.chart.chart.setSize(width, height + h , false);
        state.chart.chart.hasUserSize = null;
        if (state.chart.chart.series[0] && state.chart.chart.series[0].data.length === 0)
            state.chart.chart.showLoading();
        else
            state.chart.chart.hideLoading();
      };

      var purchase_time_promise = get_purchase_time(proposal);
      var chart_data_promise = purchase_time_promise.then(function(purchase_time){
        state.table.purchase_time = purchase_time;
        return get_chart_data(state, root);
      });

      /* back-end is not returning sell_time field, worse its returning wrong sell_price value */
      liveapi.send({profit_table: 1, date_from: proposal.date_start, date_to: proposal.date_start+1})
             .then(function(data) {
               var transactions = data.profit_table.transactions || [];
               transactions = transactions.filter(function(t) { return t.contract_id+'' === proposal.contract_id+''; });

               if(!transactions || transactions.length !== 1) { return; } /* so contract is not finished yet */
               var trans = transactions[0];
               if(trans.sell_time >= proposal.date_expiry) { return; } /* so contract is not sold at market */

               state.table.sell_time = trans.sell_time;
               state.table.sell_price = trans.sell_price;
               state.table.sell_spot = '-'; // TODO: find a way to get sell spot
               state.table.final_price = undefined; // TODO: find a way to get final price
               state.table.is_sold_at_market = true;
               state.validation = 'This contract has expired';
               chart_data_promise.then(function(){
                  state.chart.chart.addPlotLineX({ value: state.table.sell_time*1000, label: 'Sell Time'});
               });
               get_tick_value(state.chart.symbol, state.table.sell_time -2).then(function(data){
                 var history = data.history;
                 if(history.times.length !== 1) return;
                 state.table.sell_spot = history.prices[0];
               });
             })
             .catch(function(err){
               console.error(err);
             });

      return state;
  }

  function update_live_chart(state, granularity){
      var key = chartingRequestMap.keyFor(state.chart.symbol, granularity);
      if(!chartingRequestMap[key]){
          var req = {
              symbol: state.chart.symbol,
              subscribe: 1,
              granularity: granularity,
              style: granularity === 0 ? 'ticks' : 'candles',
          };
          chartingRequestMap.register(req)
              .catch(function (err) {
                $.growl.error({ message: err.message });
                console.error(err);
              });
      }
      /* don't register if already someone else has registered for this symbol */
      else { chartingRequestMap.subscribe(key); }

      var on_tick = undefined;
      var on_candles = undefined;

      if(granularity === 0) {
        var perv_tick = null;
        on_tick = liveapi.events.on('tick', function(data){
            if (!data.tick || data.tick.symbol !== state.chart.symbol)
              return;
            var chart = state.chart.chart;
            var tick = data.tick;
            chart && chart.series[0].addPoint([tick.epoch*1000, tick.quote*1]);
            /* stop updating when contract is expired */
            if(tick.epoch*1 > state.table.date_expiry*1) {
              if(perv_tick) {
                console.log('Stop changing time');
                state.table.exit_tick = perv_tick.quote;
                state.table.exit_tick_time = perv_tick.epoch*1;
                state.validation = 'This contract has expired';
              }
              clean_up();
            }
            perv_tick = tick;
        });
      }
      else {
        on_candles = liveapi.events.on('ohlc', function(data){
          var data_key = chartingRequestMap.keyFor(data.ohlc.symbol, data.ohlc.granularity);
          if(key != data_key)
            return;
          var chart = state.chart.chart;
          if(!chart)
            return;

          var series = chart.series[0];
          var last = series.data[series.data.length - 1];

          var c = data.ohlc;
          var ohlc = [c.open_time*1000, c.open*1, c.high*1, c.low*1, c.close*1];

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

      var clean_up_done = false;
      var clean_up = function() {
        console.log('clean_up called!');
        if(clean_up_done) return;
        clean_up_done = true;
        chartingRequestMap.unregister(key);
        on_tick && liveapi.events.off('tick', on_tick);
        on_candles && liveapi.events.off('candles', on_candles);
      };
      state.onclose.push(clean_up); /* clean up */
  }

  function get_chart_data(state, root) {
    var table = state.table;
    var duration = Math.min(state.table.date_expiry*1, moment.utc().unix()) - (state.table.purchase_time || state.table.date_start);
    var granularity = 0;
    var margin = 0; // time margin
    if(duration <= 60*60) { granularity = 0; } // 1 hour
    else if(duration <= 2*60*60) { granularity = 60; } // 2 hours
    else if(duration <= 6*60*60) { granularity = 120; } // 6 hours
    else if(duration <= 24*60*60) { granularity = 300; } // 1 day
    else { granularity = 3600 } // more than 1 day
    margin = granularity === 0 ? Math.max(3, 30*duration/(60*60) | 0) : 3*granularity;
    var request = {
      ticks_history: state.chart.symbol,
      start: (state.table.purchase_time || state.table.date_start)*1 - margin, /* load around 2 more thicks before start */
      end: state.table.date_expiry ? state.table.date_expiry*1 + margin : 'latest',
      style: 'ticks',
      count: 4999, /* maximum number of ticks possible */
    };
    if(granularity !== 0) {
      request.granularity = granularity;
      request.style = 'candles';
      state.chart.type = 'candles';
    }

    if(!state.table.is_expired) {
      console.log('State.table.is_expired', state.table.is_expired);
      update_live_chart(state, granularity);
    }

    return liveapi.send(request).then(function(data) {
        state.chart.loading = '';

        var options = { title: state.chart.symbol_name };
        if(data.history) options.history = data.history;
        if(data.candles) options.candles = data.candles;
        var chart = init_chart(root, options);

        if(data.history && !state.table.entry_tick_time) {
          state.table.entry_tick_time = data.history.times.filter(function(t){ return t*1 > state.table.date_start*1 })[0];
          if(!state.table.entry_tick) {
            state.table.entry_tick = data.history.prices.filter(function(p,inx){ return data.history.times[inx]*1 > state.table.date_start*1 })[0];
          }
        }
        /* TODO: see if back-end is going to give uss (entry/exit)_tick and (entry/exit)_tick_time fileds or not! */
        if(data.candles && !state.table.entry_tick_time) {
          get_tick_value(state.chart.symbol, state.table.date_start).then(function(data){
            var history = data.history;
            if(history.times.length !== 1) return;
            state.table.entry_tick_time = history.times[0];
            chart.addPlotLineX({ value: state.table.entry_tick_time*1000, label: 'Entry Spot'});
          });
        }
        if(data.history && !state.table.exit_tick_time && state.table.is_expired) {
          state.table.exit_tick_time = _.last(data.history.times.filter(function(t){ return t*1 <= state.table.date_expiry*1 }));
          state.table.exit_tick = _.last(data.history.prices.filter(function(p, inx){ return data.history.times[inx]*1 <= state.table.date_expiry*1 }));
        }
        if(data.candles && !state.table.exit_tick_time && state.table.is_expired) {
          get_tick_value(state.chart.symbol, state.table.date_expiry -2).then(function(data){
            var history = data.history;
            if(history.times.length !== 1) return;
            state.table.exit_tick_time = history.times[0];
            state.table.exit_tick = history.prices[0];
            chart.addPlotLineX({ value: state.table.exit_tick_time*1000, label: 'Exit Spot', text_left: true});
          });
        }

        state.table.purchase_time && chart.addPlotLineX({ value: state.table.purchase_time*1000, label: 'Purchase Time'});

        state.table.entry_tick_time && chart.addPlotLineX({ value: state.table.entry_tick_time*1000, label: 'Entry Spot'});
        state.table.exit_tick_time && chart.addPlotLineX({ value: state.table.exit_tick_time*1000, label: 'Exit Spot', text_left: true});

        state.table.date_expiry && chart.addPlotLineX({ value: state.table.date_expiry*1000, label: 'End Time'});
        state.table.date_start && chart.addPlotLineX({ value: state.table.date_start*1000, label: 'Start Time' ,text_left: true });

        state.chart.barrier && chart.addPlotLineY({value: state.chart.barrier*1, label: 'Barrier (' + state.chart.barrier + ')'});
        state.chart.high_barrier && chart.addPlotLineY({value: state.chart.high_barrier*1, label: 'High Barrier (' + state.chart.high_barrier + ')'});
        state.chart.low_barrier && chart.addPlotLineY({value: state.chart.low_barrier*1, label: 'Low Barrier (' + state.chart.low_barrier + ')', color: 'red'});

        state.chart.chart = chart;
        state.chart.manual_reflow();
      })
      .catch(function(err) {
        state.chart.loading = err.message;
        console.error(err);
      });
  }

  return { init: init };
});
