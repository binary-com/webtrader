/**
 * Created by amin on January 14, 2016.
 */

define(["jquery", "windows/windows", "websockets/binary_websockets", "common/rivetsExtra", "moment", "jquery-growl", 'common/util'],
  function($, windows, liveapi, rv, moment){

  require(['css!viewtransaction/viewTransaction.css']);
  require(['text!viewtransaction/viewTransaction.html']);

  /* rv binder to show tick chart for this confirmation dialog */
  rv.binders['transaction-chart'] = {
    priority: 64, /* a low priority to apply last */
    bind: function(el) {
        var model = this.model;
        el.chart = new Highcharts.Chart({
          title: '',
          credits: {enabled: false},
          chart: {
              type: 'datetime',
              renderTo: el,
              backgroundColor: null, /* make background transparent */
              width: (el.getAttribute('width') || 350)*1,
              height: (el.getAttribute('height') || 120)*1,
          },
          tooltip: { formatter: function () {
            return 'tooltip';
              // var tick = model.array[this.x-1];
              // return (tick && tick.tooltip) || false;
          }},
          xAxis: {
              type: 'linear',
              min: 0,
              startOnTick: true,
              endOnTick: true,
              // min: el.getAttribute('start')*1,
              // max: el.getAttribute('end')*1 + 1 /* exist spot vertical plot will not be at the end */,
              labels: { enabled: false, }
          },
          yAxis: {
              labels: { align: 'left', x: 0, },
              title: '',
              gridLineWidth: 0,
          },
          series: [{ data: [] }],
          exporting: {enabled: false, enableImages: false},
          legend: {enabled: false},
      });
    }, /* end of => bind() */
    routine: function(el, ticks){
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

      /* if its an array then we will show a live view and only update the last element */
      if(Array.isArray(ticks)) {
        var index = ticks.length;
        if(index == 0) return;

        var tick = _.last(ticks);
        el.chart.series[0].addPoint([index, tick.quote*1]);

        var plot_x = model.getPlotX(); // could return null
        plot_x && addPlotLineX(el.chart,plot_x);
        var plot_y = model.getPlotY(); // could return null
        plot_y && el.chart.yAxis[0].removePlotLine(plot_y.id);
        plot_y && addPlotLineY(el.chart, plot_y);
      }
      else { /* ticks : { times: [], prices: []}, */
          var points = [];
          for(var i = 0, len = ticks.times.length; i < len; ++i) {
            points.push([ticks.times[i],ticks.prices[i]])
            el.chart.series[0].addPoint([ticks.times[i],ticks.prices[i]]);
          }
        // el.chart.addSeries({data: points});
        console.warn(points);
      }

    } /* end of routine() */
  };

  /* params : { symbol: ,contract_id: ,longcode: ,sell_time: ,
                purchase_time: ,buy_price: ,sell_price:, currency:, } */
  function init(params) {
    require(['text!viewtransaction/viewTransaction.html'],function(html){
        var root = $(html);
        var transWin = windows.createBlankWindow(root, {
            title: 'Transaction ' + params.contract_id, /* TODO: use symbol_name instead */
            width: 700,
            minHeight:90,
            destroy: function() { },
            close: function() { view.unbind(); },
            'data-authorized': 'true'
        });

        var state = init_state(params);
        var view = rv.bind(root[0],state)

        transWin.dialog('open');
    })
  }

  function init_state(params){
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
            history: {
              prices: [],
              times: []
            },
            purchase_time: params.purchase_price,
            sell_time: params.sell_time,
            loading: 'Loading ' + params.symbol + ' ...',
          }
      };

      /* TODO: register for the stream and update the status */
      liveapi.send({proposal_open_contract: 1, contract_id: params.contract_id})
             .then(function(data){
               console.warn(data.proposal_open_contract);
               state.validation = data.validation_error || 'This contract has expired';
             })
             .catch(function(err){
               state.validation = err.message;
               console.error(err);
             });

      /* TODO: use the loading message in the chart */
      liveapi.send({ticks_history: params.symbol, start: params.purchase_time, end: params.sell_time, count: 10*1000 /* no limit */})
             .then(function(data){
               state.chart.history = data.history;
               state.chart.loading = '';
             })
             .catch(function(err) {
               chart.loading = err.message;
               console.error(err);
             });

      return state;
  }

  return { init: init };
});
