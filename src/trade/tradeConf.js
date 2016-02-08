/*
 * Created by amin on December 4, 2015.
 */

define(['lodash', 'jquery', 'moment', 'websockets/binary_websockets', 'common/rivetsExtra', 'charts/chartingRequestMap', 'text!trade/tradeConf.html', 'css!trade/tradeConf.css' ],
  function(_, $, moment, liveapi, rv, chartingRequestMap, html){

    require(['websockets/stream_handler']);
    var barsTable = chartingRequestMap.barsTable;
    /* rv binder to show tick chart for this confirmation dialog */
    rv.binders['tick-chart'] = {
      priority: 65, /* a low priority to apply last */
      bind: function(el) {
          var model = this.model;
          el.chart = new Highcharts.Chart({
            title: '',
            credits: {enabled: false},
            chart: {
                type: 'line',
                renderTo: el,
                backgroundColor: null, /* make background transparent */
                width: (el.getAttribute('width') || 350)*1,
                height: (el.getAttribute('height') || 120)*1,
            },
            tooltip: { formatter: function () {
                var tick = model.array[this.x-1];
                return (tick && tick.tooltip) || false;
            }},
            xAxis: {
                type: 'linear',
                min: 1,
                max: el.getAttribute('tick-count')*1 + 1 /* exist spot vertical plot will not be at the end */,
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
    };

    function register_ticks(state, extra){
      var tick_count = extra.tick_count * 1,
          symbol = extra.symbol,
          purchase_epoch = state.buy.purchase_time * 1;

      /* TODO: if the connection get closed while we are adding new ticks,
               although we will automatically resubscribe (in binary_websockets),
               BUT we will also lose some ticks in between!
               which means we ware showing the wrong ticks to the user! FIX THIS*/
      function add_tick(tick){
          state.ticks.array.push({
            quote: tick.quote,
            epoch: tick.epoch,
            number: state.ticks.array.length+1,
            tooltip: moment.utc(tick.epoch*1000).format("dddd, MMM D, HH:mm:ss") + "<br/>" +
                     extra.symbol_name + " " + tick.quote,
          });
          --tick_count;
          if(tick_count === 0) {
              state.ticks.update_status();
              state.buy.update(); /* show buy-price final and profit & update title */
              state.back.visible = true; /* show back button */
              liveapi.events.off('tick',fn); /* unregister from tick stream */
          }
          /* update state for each new tick in Up/Down && Asians contracts */
          if(state.ticks.category !== 'Digits')
              state.ticks.update_status();
      }
      var key = chartingRequestMap.keyFor(symbol, 0);
      var ticks  = barsTable.find({instrumentCdAndTp: key});
      var start_time = state.buy.start_time*1000;
      ticks = ticks.filter(function(tick) { return tick.time > start_time; })
                   .map(function(tick) { return {quote: tick.open, epoch: tick.time/1000 }; })
                   .sort(function(a,b) { return a.epoch - b.epoch; });
      ticks.forEach(add_tick); /* add existing ticks */

      var fn = liveapi.events.on('tick', function (data) {
          if (tick_count === 0 || !data.tick || data.tick.symbol !== symbol || data.tick.epoch * 1 < purchase_epoch)
            return;
          add_tick(data.tick);
      });
    }

    function init(data, extra, show_callback, hide_callback){
      var root = $(html);
      var buy = data.buy;
      var state = {
        title: {
          text: 'Contract Confirmation',
        },
        buy: {
          message: buy.longcode,
          balance_after: buy.balance_after,
          buy_price: buy.buy_price,
          purchase_time: buy.purchase_time,
          start_time: buy.start_time,
          transaction_id: buy.transaction_id,
          payout: buy.payout,
          currency: extra.currency,
          potential_profit : buy.payout - buy.buy_price,
          potential_profit_text : 'Profit',
          show_result: false,
        },
        spreads: {
            amount_per_point: buy.amount_per_point || '0',
            stop_loss_level: buy.stop_loss_level || '0',
            stop_profit_level: buy.stop_profit_level || '0',
        },
        ticks: {
            array: [],
            average: function(){
              var array = this.array;
              var sum = 0;
              for(var i = 0; i < array.length; ++i)
                sum += array[i].quote*1;
              var avg = sum / (array.length || 1);
              return avg;
            },
            getPlotX: function(){
              var inx = this.array.length;
              if(inx === 1) return {value: inx, label: 'Entry Spot'};
              if(inx === this.tick_count) return {value:inx, label: 'Exit Spot'}
              return null;
            },
            getPlotY: function(){
              var inx = this.array.length;
              var tick = this.array[inx-1];
              if(this.category === 'Up/Down' && inx === 1)
                return {value: tick.quote*1, label:'Barrier ('+tick.quote+')', id: 'plot-barrier-y'};

              if(this.category === 'Asians') {
                var avg = this.average().toFixed(5);
                return {value: avg, label:'Average ('+ avg +')', id: 'plot-barrier-y'};
              }
              return null;
            },
            tick_count: extra.tick_count,
            value: (extra.digits_value || '0') + '', // last digit value selected by the user
            category: extra.category,
            category_display: extra.category_display,
            status: 'waiting', /* could be 'waiting', 'lost' or 'won' */
            chart_visible: extra.show_tick_chart,
        },
        arrow: {
          visible: !extra.show_tick_chart && extra.category !== 'Digits',
        },
        back: { visible: false }, /* back buttom */
      };

      state.buy.update = function(){
        var status = state.ticks.status;
        state.title.text = { waiting: 'Contract Confirmation',
                              won : 'This contract won',
                              lost: 'This contract lost'
                            }[status];
        if(status === 'lost') {
          state.buy.potential_profit = -state.buy.buy_price;
          state.buy.payout = 0;
          state.buy.potential_profit_text = 'Lost';
        }
        if(status === 'won') {
            state.buy.balance_after = buy.balance_after*1 + state.buy.payout*1;
        }
        state.buy.show_result = true;
      }
      state.ticks.update_status = function() {
        var first_quote = _.head(state.ticks.array).quote + '',
            last_quote = _.last(state.ticks.array).quote + '',
            digits_value = state.ticks.value + '',
            average = state.ticks.average().toFixed(5);
        var category = state.ticks.category,
            display = state.ticks.category_display;
        var css = {
              Digits: {
                matches:  _.last(last_quote) === digits_value,
                differs:  _.last(last_quote) !== digits_value,
                over: _.last(last_quote)*1 > digits_value*1,
                under: _.last(last_quote)*1 < digits_value*1,
                odd: (_.last(last_quote)*1)%2 === 1,
                even: (_.last(last_quote)*1)%2 === 0
              },
              'Up/Down': {
                rise: last_quote*1 > first_quote*1,
                fall: last_quote*1 < first_quote*1
              },
              Asians: {
                'asian up': average < last_quote*1,
                'asian down': average > last_quote*1,
              }
            };
          /* set the css class */
          state.ticks.status = css[category][display] ? 'won' : 'lost';
      }

      state.back.onclick = function(){ hide_callback(root); }
      state.arrow.onclick = function(e) {
        var $target = $(e.target);
        $target.addClass('disabled');
        require(['viewtransaction/viewTransaction'], function(viewTransaction){
            viewTransaction.init(extra.contract_id, extra.transaction_id)
                           .then(function(){ $target.removeClass('disabled'); });
        });
      };


      if(!state.arrow.visible) { register_ticks(state, extra); }
      else { state.back.visible = true; }


      var view = rv.bind(root[0], state)
      show_callback(root);
    }

    return {
      init: init
    }
});
