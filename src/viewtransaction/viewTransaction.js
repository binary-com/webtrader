/**
 * Created by amin on January 14, 2016.
 */

define(["jquery", "windows/windows", "websockets/binary_websockets", "common/rivetsExtra", "moment", "lodash", "jquery-growl", 'common/util'],
  function($, windows, liveapi, rv, moment, _) {
  'use strict';

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
          type: 'live',
          renderTo: el,
          backgroundColor: null, /* make background transparent */
          width: 0,
          height: 0,
          events: {
              load: function() {
                  this.credits.element.onclick = function() {
                      window.open(
                          'http://www.binary.com',
                          '_blank'
                      );
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
          min: _.first(data)[0],
          max: _.last(data)[0],
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
           width: options.width || 2,
        });
      };

      chart.addPlotLineY = function(options) {
        chart.yAxis[0].addPlotLine({
          id: options.id || options.label,
          value: options.value,
          label: {text: options.label, align: 'center'},
          color: options.color || 'green',
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

  /* params : { symbol: ,contract_id: ,longcode: ,sell_time: ,
                purchase_time: ,buy_price: ,sell_price:, currency:,
                duration: , duration_type: 'ticks/seconds/...' } */
  function init(contract_id, transaction_id){
    require(['text!viewtransaction/viewTransaction.html']);
    liveapi.cached.send({proposal_open_contract: 1, contract_id: contract_id})
           .then(function(data){
              var proposal = data.proposal_open_contract;
              proposal.transaction_id = transaction_id;
              proposal.symbol = proposal.underlying;
              get_symbol_name(proposal.symbol).then(function(symbol_name){
                proposal.symbol_name = symbol_name;
                init_dialog(proposal);
              }).catch(function(err) { console.error(err); })
           })
           .catch(function(err){
             console.error(err);
             $.growl.error({ message: err.message });
           });
  }

  function init_dialog(proposal) {
    require(['text!viewtransaction/viewTransaction.html'],function(html) {
        var root = $(html);
        var state = init_state(proposal, root);
        var transWin = windows.createBlankWindow(root, {
            title: proposal.symbol_name + ' (' + proposal.transaction_id + ')',
            width: 700,
            minWidth: 300,
            minHeight:350,
            destroy: function() { },
            close: function() { view && view.unbind(); },
            resize: function() {
              state.chart.manual_reflow();
              // state.chart.chart && state.chart.chart.reflow();
            },
            close: function() { view.unbind(); },
            'data-authorized': 'true'
        });

        transWin.dialog('open');
        var view = rv.bind(root[0],state)
    });
  }

  function init_state(proposal, root){
      var state = {
          route: {
              value: 'table',
              update: function(value) { state.route.value = value; }
          },
          longcode: proposal.longcode,
          validation: proposal.validation_error
                || (!proposal.is_valid_to_sell && 'Resale of this contract is not offered')
                || (proposal.is_expired && 'This contract has expired') || '-',
          table: {
            currency: (proposal.currency ||  'USD') + ' ',
            now: moment.utc().unix(),
            date_start: proposal.date_start,
            date_expiry: proposal.date_expiry,

            entry_tick: proposal.entry_tick,
            entry_tick_time: proposal.entry_tick_time,
            exit_tick: proposal.exit_tick,
            exit_tick_time: proposal.exit_tick_time,
            current_tick: undefined,

            buy_price: proposal.buy_price && formatPrice(proposal.buy_price),
            bid_price: undefined, // proposal.bid_price && formatPrice(proposal.bid_price),
            sell_price: proposal.sell_price && formatPrice(proposal.sell_price),

            tick_count: proposal.tick_count,
            prediction: proposal.prediction,
          },
          chart: {
            chart: null, /* highchart object */
            symbol: proposal.symbol,
            symbol_name: proposal.symbol_name,
            barrier: proposal.barrier,
            high_barrier: proposal.high_barrier,
            low_barrier: proposal.low_barrier,
            loading: 'Loading ' + proposal.symbol_name + ' ...',
          }
      };

      state.chart.manual_reflow = function() {
        /* TODO: find a better solution for resizing the chart  :/ */
        var h = -1 * (root.find('.longcode').height() + root.find('.tabs').height() + root.find('.footer').height()) - 16;
        if(!state.chart.chart) return;
        var container = root;// root.find('.chart-container');
        var width = container.width(), height = container.height();
        state.chart.chart.setSize(width, height + h , false);
        state.chart.chart.hasUserSize = null;
      };

      /* TODO: register for the stream and update the status */
      if(false)
      liveapi.send({proposal_open_contract: 1, contract_id: proposal.contract_id})
             .then(function(data){
               state.validation = data.validation_error || 'This contract has expired';
             })
             .catch(function(err){
               state.validation = err.message;
               console.error(err);
             });

      get_chart_data(state, root);

      return state;
  }

  function get_chart_data(state, root) {
    var table = state.table;
    var duration = state.table.date_expiry - state.table.date_start;
    var granularity = 0;
    var margin = 0; // time margin
    if(duration < 60*60) { granularity = 0; } // 1 hour
    else if(duration <= 2*60*60) { granularity = 60; } // 6 hours
    else if(duration <= 6*60*60) { granularity = 120; } // 6 hours
    else if(duration <= 24*60*60) { granularity = 300; } // 1 day
    else { granularity = 3600 } // more than 1 day
    margin = granularity === 0 ? 3 : 3*granularity;
    var request = {
      ticks_history: state.chart.symbol,
      start: state.table.date_start - margin, /* load around 2 more thicks before start */
      end: state.table.date_expiry ? state.table.date_expiry*1 + margin : 'latest',
      style: granularity === 0 ? 'ticks' : 'candles',
      count: 4999, /* maximum number of ticks possible */
    };

    liveapi.send(request)
      .then(function(data) {
        state.chart.loading = '';

        var options = { title: state.chart.symbol_name };
        if(data.history) options.history = data.history;
        if(data.candles) options.candles = data.candles;
        var chart = init_chart(root, options);

        if(data.history && !state.table.entry_tick_time) {
          state.table.entry_tick_time = data.history.times.filter(function(t){ return t*1 >= state.table.date_start*1 })[0];
        }
        /* TODO: see if back-end is going to give uss (entry/exit)_tick and (entry/exit)_tick_time fileds or not! */
        // if(data.candles && !state.table.entry_tick_time) {
        //   state.table.entry_tick_time = data.candles.filter(function(c) { return c.epoch*1 >= state.table.date_start*1 })[0].epoch *1;
        // }
        if(data.history && !state.table.exit_tick_time) {
          state.table.exit_tick_time = _.last(data.history.times.filter(function(t){ return t*1 <= state.table.date_expiry*1 }));
        }
        // if(data.candles && !state.table.exit_tick_time) {
        //   state.table.exit_tick_time = data.candles.filter(function(c) { return c.epoch*1 <= state.table.date_expiry*1 })[0].epoch *1;
        // }

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
