/**
 * Created by amin on January 14, 2016.
 */

define(["jquery", "windows/windows", "websockets/binary_websockets", "common/rivetsExtra", "moment", "lodash", "jquery-growl", 'common/util'],
  function($, windows, liveapi, rv, moment, _){

  require(['css!viewtransaction/viewTransaction.css']);
  require(['text!viewtransaction/viewTransaction.html']);

  function init_chart(root, ticks) {
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
        tooltip: { formatter: function () { return moment.utc(this.x*1000).format("dddd, MMM D, HH:mm:ss"); } },
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
      if(params.duration_type === 'ticks'){
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
                 ticks.push([times[i]*1, prices[i]*1]);
               }
               state.chart.loading = '';

               /* TODO: tell backend they are returning the wrong sell time */
               var sell_time = params.sell_time;

               var chart = init_chart(root, ticks);
               var entry_spot = history.times.filter(function(t){ return t*1 >= start_time })[0];
               var exit_spot =  null;
               if(params.duration_type === 'ticks') {
                  exit_spot = history.times[history.times.indexOf(entry_spot) + params.duration*1];
               }
               exit_spot = exit_spot || exit_spot*1;
               entry_spot = entry_spot*1;

               (start_time !== entry_spot) && chart.addPlotLineX({ value: start_time, label: 'Start Time' ,text_left: true });
               entry_spot && chart.addPlotLineX({ value: entry_spot, label: 'Entry Spot'});
               exit_spot && chart.addPlotLineX({ value: exit_spot, label: 'Exit Spot'});
               sell_time && chart.addPlotLineX({ value: sell_time*1, label: 'Sell Time'});
               end_time && chart.addPlotLineX({ value: end_time, label: 'End Time'});

               state.chart.chart = chart;
               state.chart.manual_reflow();
             })
             .catch(function(err) {
               chart.loading = err.message;
               console.error(err);
             });
  }

  /* params : { symbol: ,contract_id: ,longcode: ,sell_time: ,
                purchase_time: ,buy_price: ,sell_price:, currency:,
                duration: , duration_type: 'ticks/seconds/...' } */
  function init(params) {
    require(['text!viewtransaction/viewTransaction.html'],function(html) {
        var root = $(html);
        var state = init_state(params, root);
        var transWin = windows.createBlankWindow(root, {
            title: 'Transaction ' + params.contract_id, /* TODO: use symbol_name instead */
            width: 700,
            minWidth: 350,
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
    })
  }

  function init_state(params, root){
      var state = {
          route: {
              // value: 'table',
              value: 'chart',
              update: function(value) { state.route.value = value; }
          },
          longcode: params.longcode,
          validation: '-',
          table: {
            currency: params.currency ? params.currency + ' ' : 'USD ',
            now: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
            purchase_time: params.purchase_time && moment.utc(params.purchase_time).format('YYYY-MM-DD HH:mm:ss'),
            sell_time: params.sell_time && moment.utc(params.sell_time).format('YYYY-MM-DD HH:mm:ss'),

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

      window.state = state; /* TODO: remove this when you are done!*/
      window.root = root;
      window.params = params;
      return state;
  }

  return { init: init };
});
