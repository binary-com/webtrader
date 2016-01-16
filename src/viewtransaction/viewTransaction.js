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
          data: ticks,
          type:'line'
        }],
        exporting: {enabled: false, enableImages: false},
        legend: {enabled: false},
        navigator: { enabled: true },
      };
      return el.chart = new Highcharts.Chart(options);
  };

  function update_chart(el, chart, ticks){
      var model = this.model;
      var addPlotLineX = function(chart, options) {
        chart.xAxis[0].addPlotLine({
           value: options.value,
           id: options.id || options.value,
           label: {text: options.label || 'label'},
           color: options.color || '#e98024',
           width: options.width || 2,
        });
      };

      var addPlotLineY = function(chart,options) {
        chart.yAxis[0].addPlotLine({
          id: options.id || options.label,
          value: options.value,
          label: {text: options.label, align: 'center'},
          color: 'green',
          width: 2,
        });
      };

      var index = ticks.length;
      if(index == 0) return;

      var tick = _.last(ticks);
      el.chart.series[0].addPoint([index, tick.quote*1]);

      var plot_x = model.getPlotX(); // could return null
      plot_x && addPlotLineX(el.chart,plot_x);
      var plot_y = model.getPlotY(); // could return null
      plot_y && el.chart.yAxis[0].removePlotLine(plot_y.id);
      plot_y && addPlotLineY(el.chart, plot_y);

    } /* end of routine() */

  /* params : { symbol: ,contract_id: ,longcode: ,sell_time: ,
                purchase_time: ,buy_price: ,sell_price:, currency:, } */
  function init(params) {
    require(['text!viewtransaction/viewTransaction.html'],function(html){
        var root = $(html);
        var state = init_state(params, root);
        var transWin = windows.createBlankWindow(root, {
            title: 'Transaction ' + params.contract_id, /* TODO: use symbol_name instead */
            width: 700,
            minHeight:90,
            destroy: function() { },
            resize: function() {
              state.chart.manual_reflow();
              // state.chart.chart && state.chart.chart.reflow();
            },
            close: function() { view.unbind(); },
            'data-authorized': 'true'
        });

        var view = rv.bind(root[0],state)

        transWin.dialog('open');
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
            chart: null, /* highchar object */
            loading: 'Loading ' + params.symbol + ' ...',/* TODO: show this loading message in the chart */
          }
      };

      state.chart.manual_reflow = function(w, h) {
        w  = w || 0;
        h = h || -90;
        if(!state.chart.chart) return;
        var container = root;// root.find('.chart-container');
        var width = container.width(), height = container.height();
        state.chart.chart.setSize(width + w, height +h , false);
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

      liveapi.send({ticks_history: params.symbol, start: params.purchase_time, end: params.sell_time, count: 10*1000 /* no limit */})
             .then(function(data){
               var times = data.history.times, prices = data.history.prices;
               var ticks = [];
               for(var i = 0; i < times.length; ++i) {
                 ticks.push([times[i]*1, prices[i]*1]);
               }
               state.chart.loading = '';
               state.chart.chart = init_chart(root, ticks);
               state.chart.manual_reflow();
             })
             .catch(function(err) {
               chart.loading = err.message;
               console.error(err);
             });

      window.state = state; /* TODO: remove this when you are done!*/
      window.root = root;
      return state;
  }

  return { init: init };
});
