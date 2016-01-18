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
        title: '',
        credits: { href: 'https://www.binary.com', text: 'Binary.com' },
        chart: {
          type: 'live',
          renderTo: el,
          backgroundColor: null, /* make background transparent */
          width: 0,
          height: 0,
        },
        title:{
          text: symbol_name,
          style: { fontSize:'16px' }
        },
        tooltip:{ xDateFormat:'%A, %b %e, %H:%M:%S GMT' },
        // tooltip: { formatter: function () {
        //     return moment.utc(this.x).format("dddd, MMM D, HH:mm:ss") + "<br/>" + this.y;
        // } },
        xAxis: {
          type: 'datetime',
          categories:null,
          startOnTick: false,
          endOnTick: false,
          min: _.head(ticks)[0],
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

  function get_chart_data(state, root, params) {
      var start_time = params.purchase_time*1;
      var end_time = null;
      var request = { ticks_history: params.symbol };
      if(params.duration_type[0] === 't'){
          request.start = start_time - 3; /* load around 2 more thicks before start */
          request.end = start_time +  params.duration*2 + 3;
      }
      else {
        var priod = {'s': 1, 'm': 60, 'h': 60*60, 'd': 60*60*24 }[params.duration_type[0]];
        var seconds = params.duration * priod;
        var margin = {'s': 4, 'm': 4, 'h': 60, 'd': 60*60 }[params.duration_type[0]];
        request.start = start_time - margin;
        request.end = start_time + seconds + margin;
        request.count = 1000*1000; /* no limit  */
        end_time = start_time + seconds;
      }

      liveapi.send(request)
             .then(function(data){
               var history = data.history;
               var times = history.times, prices = history.prices;
               var ticks = [];
               for(var i = 0; i < times.length; ++i) {
                 ticks.push([times[i]*1000, prices[i]*1]);
               }
               state.chart.loading = '';

               /* TODO: tell backend they are returning the wrong sell time */
               var sell_time = params.sell_time;

               var chart = init_chart(root, ticks, params.symbol_name);
               var entry_spot = history.times.filter(function(t){ return t*1 > start_time })[0];
               var exit_spot =  null;
               if(params.duration_type[0] === 't') {
                  exit_spot = history.times[history.times.indexOf(entry_spot) + params.duration*1];
               }
               if(params.duration_type[0] !== 't' && end_time) {
                  exit_spot = _(history.times).filter(function(t) { return t*1 <= end_time; }).last();
               }

               (start_time*1 !== entry_spot*1) && chart.addPlotLineX({ value: start_time*1000, label: 'Start Time' ,text_left: true });
               entry_spot && chart.addPlotLineX({ value: entry_spot*1000, label: 'Entry Spot'});
               exit_spot && chart.addPlotLineX({ value: exit_spot*1000, label: 'Exit Spot', text_left: true});
               (sell_time*1 < exit_spot*1) && chart.addPlotLineX({ value: sell_time*1000, label: 'Sell Time'});
               end_time && chart.addPlotLineX({ value: end_time*1000, label: 'End Time'});

               if(entry_spot) {
                 var entry_spot_value = history.prices[history.times.indexOf(entry_spot)];
                 state.table.entry_spot = entry_spot_value;
               }
               if(exit_spot) {
                 var exit_spot_value = history.prices[history.times.indexOf(exit_spot)];
                 state.table.exit_spot = exit_spot_value;
               }
               if(end_time) {
                  state.table.end_time = moment.utc(end_time*1000).format('YYYY-MM-DD HH:mm:ss');
               }

               state.chart.chart = chart;
               state.chart.manual_reflow();
             })
             .catch(function(err) {
               state.chart.loading = err.message;
               console.error(err);
             });
  }

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
  function init(params) {
    require(['text!viewtransaction/viewTransaction.html']);
    get_symbol_name(params.symbol).then(function(symbol_name){
        params.symbol_name = symbol_name;
        require(['text!viewtransaction/viewTransaction.html'],function(html) {
            var root = $(html);
            var state = init_state(params, root);
            var transWin = windows.createBlankWindow(root, {
                title: params.symbol_name + ' (' + params.transaction_id + ')',
                width: 700,
                minWidth: 300,
                minHeight:350,
                destroy: function() { },
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
    });
  }

  function init_state(params, root){
      var state = {
          route: {
              value: 'table',
              update: function(value) { state.route.value = value; }
          },
          longcode: params.longcode,
          validation: '-',
          table: {
            currency: params.currency ? params.currency + ' ' : 'USD ',
            now: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
            purchase_time: params.purchase_time && moment.utc(params.purchase_time*1000).format('YYYY-MM-DD HH:mm:ss'),
            end_time: undefined,

            entry_spot: undefined,
            current_spot: undefined,
            exit_spot: undefined,

            purchase_price: params.buy_price && (params.buy_price*1).toFixed(2),
            indicative_price: undefined,
            final_price: params.sell_price && (params.sell_price*1).toFixed(2),
          },
          chart: {
            chart: null, /* highchart object */
            loading: 'Loading ' + params.symbol + ' ...',/* TODO: show this loading message in the chart */
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
      liveapi.send({proposal_open_contract: 1, contract_id: params.contract_id})
             .then(function(data){
               state.validation = data.validation_error || 'This contract has expired';
             })
             .catch(function(err){
               state.validation = err.message;
               console.error(err);
             });

      get_chart_data(state, root, params);

      return state;
  }

  return { init: init };
});
