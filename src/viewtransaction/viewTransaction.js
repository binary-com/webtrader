/**
 * Created by amin on January 14, 2016.
 */

define(["jquery", "windows/windows", "websockets/binary_websockets", "common/rivetsExtra", "moment", "lodash", "jquery-growl", 'common/util'],
  function($, windows, liveapi, rv, moment, _) {
  'use strict';

  require(['css!viewtransaction/viewTransaction.css']);
  require(['text!viewtransaction/viewTransaction.html']);

  function init_chart(root, ticks, symbol_name) {
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
          text: symbol_name,
          style: { fontSize:'16px' }
        },
        tooltip:{ xDateFormat:'%A, %b %e, %H:%M:%S GMT' },
        xAxis: {
          type: 'datetime',
          categories:null,
          startOnTick: false,
          endOnTick: false,
          min: _.first(ticks)[0],
          max: _.last(ticks)[0],
          labels: { overflow:"justify", format:"{value:%H:%M:%S}" },
        },
        yAxis: {
          labels: { align: 'left', x: 0, y: -2 },
          title: '',
          // gridLineWidth: 0,
        },
        series: [{
          name: symbol_name,
          data: ticks,
          type:'line'
        }],
        exporting: {enabled: false, enableImages: false},
        legend: {enabled: false},
        navigator: { enabled: true },
        plotOptions: { line: { marker: { radius: 2 } } },
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
          color: 'green',
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
                console.warn(proposal);
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
      var margin = state.chart.tick_count ? 3 : 60;
      var request = {
        ticks_history: state.chart.symbol,
        start: state.table.date_start - margin, /* load around 2 more thicks before start */
        end: state.table.date_expiry ? state.table.date_expiry*1 + margin : 'latest',
        count: 1000*1000*1000, /* no limit */
     };

      liveapi.send(request)
             .then(function(data){
               var history = data.history;
               var times = history.times;
               var prices = history.prices;
               var ticks = [];
               for(var i = 0; i < times.length; ++i) {
                 ticks.push([times[i]*1000, prices[i]*1]);
               }
               state.chart.loading = '';

               var chart = init_chart(root, ticks, state.chart.symbol_name);

               state.table.entry_tick_time && chart.addPlotLineX({ value: state.table.entry_tick_time*1000, label: 'Entry Spot'});
               state.table.exit_tick_time && chart.addPlotLineX({ value: state.table.exit_tick_time*1000, label: 'Exit Spot', text_left: true});

               state.table.date_expiry && chart.addPlotLineX({ value: state.table.date_expiry*1000, label: 'End Time'});
               state.table.date_start && chart.addPlotLineX({ value: state.table.date_start*1000, label: 'Start Time' ,text_left: true });
               console.warn(_.first(ticks)[0], state.table.date_start*1000);

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
