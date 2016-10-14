/* created by arnab, on May 25, 2016 */
define(['websockets/binary_websockets', 'common/rivetsExtra' , 'lodash'], function(liveapi, rv, _) {
    require(['text!charts/overlay/overlayManagement.html']);
    require(['css!charts/overlay/overlayManagement.css']);
    var win = null;
    var win_view = null;
    var state = {};

    /* rviets formatter to filter indicators based on their category */
    rv.formatters['overlays-filter'] = function(array, search) {
      search = search && search.toLowerCase();
      return array && array.filter(function(ind){
        return ind.display_name.toLowerCase().indexOf(search) !== -1;
      });
    };

    function init() {
      if(!win)
        return new Promise(function(resolve, reject){
          require(['text!charts/overlay/overlayManagement.html'], function(root){
            init_dialog_async(root).then(resolve);
          });
        });
      return Promise.resolve();
    }

    function init_dialog_async(root) {
        return new Promise(function(resolve, reject){
          root = $(root).i18n();

          /* affiliates route */
          if (getParameterByName("affiliates") == 'true') {
            win = $(root).dialog({
              autoOpen: false,
              resizable: false,
              width: Math.min(480, $(window).width() - 10),
              height: 400,
              modal: true,
              my: 'center',
              at: 'center',
              of: window,
              buttons: []
            });

            init_state(root);
            resolve();
            return;
          }

          /* normal route */
          require(['windows/windows'], function(windows){
            win = windows.createBlankWindow(root, {
                title: 'Add/remove overlays'.i18n(),
                width: 700,
                modal: true,
                // minHeight: 60,
                destroy: function () {
                  win_view && win_view.unbind();
                  win_view = null;
                  win.dialog('destroy').remove();
                  win = null;
                },
                open: function () { },
            });

            init_state(root);
            resolve();
          });

        });
    }

    function init_state(root){
      state = {
        dialog: {
          title: 'Add/remove overlays'.i18n(),
          container_id: ''
        },
        overlays: {
          search: '',
          array: [],
          current: []
        }
      };

      state.overlays.clear_search = function() { state.overlays.search = ''; }

      state.overlays.add = function(ovlay){
          var symbol = ovlay.symbol;
          var delay_amount = ovlay.delay_amount;
          var displaySymbol = ovlay.display_name;
          var containerIDWithHash = state.dialog.container_id;
          var mainSeries_timePeriod = $(containerIDWithHash).data("timePeriod");
          var dialog = $(containerIDWithHash);
          var type = dialog.data("type");

          //validate time period of the main series
          require(['charts/chartOptions', "charts/charts", "common/util"], function (chartOptions, charts) {
              var newTabId = containerIDWithHash.replace("#", "").replace("_chart", "");
              var dialog = $(containerIDWithHash);
              var fn = function () {
                  dialog.data("overlayIndicator", true);
                  chartOptions.disableEnableCandlestickAndOHLC( newTabId, false );
                  charts.overlay(containerIDWithHash, symbol, displaySymbol, delay_amount)
                        .then(function() {
                          var overlay = { symbol: symbol, displaySymbol: displaySymbol, delay_amount: delay_amount};
                          //Waiting for overlays to be applied.
                          _.defer(function(){
                            dialog.trigger('chart-overlay-add', overlay);
                            charts.refresh( containerIDWithHash );
                          });
                        })
              };
              if (type === 'candlestick' || type == 'ohlc') {
                  dialog.data('type', 'line');
                  dialog.trigger('chart-type-changed', 'line');
                  chartOptions.selectChartType(newTabId, 'line', false);
                  _.defer(fn);
              } else { fn(); }

              state.overlays.current.push(displaySymbol);
              ovlay.dont_show = true;
          });
      }

      state.overlays.remove = function(ovlay){
          var containerIDWithHash = state.dialog.container_id;
          var dialog = $(containerIDWithHash);
          var chart = dialog.highcharts();
          if (chart && ovlay) {
              var series = _.find(chart.series, function(s) { return s.options.name === ovlay && s.options.id !== 'navigator'; });
              if (series) {
                  var indicator_series = chart.get_indicator_series();
                  //Remove current price line first
                  series.removeCurrentPrice();
                  //Then remove the series
                  series.remove();
                  //Re-validate chart
                  _.defer(function () {
                      var countInstrumentSeries = 0;
                      chart.series.forEach(function (s) {
                          if ((s.options.isInstrument || s.options.onChartIndicator) && s.options.id.indexOf('navigator') == -1) {
                              ++countInstrumentSeries;
                          }
                      });
                      if (countInstrumentSeries == 1) {
                          chart.series.forEach(function (s) {
                              if ((s.options.isInstrument || s.options.onChartIndicator) && s.options.id.indexOf('navigator') == -1) {
                                  s.update({
                                      compare: undefined
                                  });
                                  $(containerIDWithHash).data('overlayIndicator', null);
                                  require(['charts/chartOptions'], function (chartOptions) {
                                      var newTabId = containerIDWithHash.replace("#", "").replace("_chart", "");
                                      chartOptions.disableEnableCandlestickAndOHLC(newTabId, true);
                                  });
                                  _.defer(function () {
                                      chart.redraw();
                                  })
                                  return false;
                              }
                          });
                      }
                      chart.set_indicator_series(indicator_series);
                  });
              }

              var break_loop = false;
              state.overlays.array.forEach(function(market) {
                  market.submarkets.forEach(function (submarket) {
                      submarket.instruments.forEach(function (ind) {
                          if (ind.display_name === ovlay) {
                              ind.dont_show = false;
                              break_loop = true;
                          }
                          return !break_loop;
                      });
                      return !break_loop;
                  });
                  return !break_loop;
              });
              state.overlays.current.splice(state.overlays.current.indexOf(ovlay), 1);
              dialog.trigger('chart-overlay-remove', {displaySymbol: ovlay});
          }

      }

      win_view = rv.bind(root[0], state);
    }

    function update_overlays(chart) {
        require(['instruments/instruments'], function(instruments) {
            var mainSeriesName = chart.series[0].options.name;
            var current = _.filter(chart.series, function(s, index) {
                return s.options.isInstrument && s.options.id !== 'navigator' && index !== 0;
            }).map(function(s) { return s.options.name; }) || [];

            var marketData = instruments.getMarketData() || [];
            marketData.forEach(function(market) {
                market.submarkets.forEach(function (submarket) {
                    submarket.instruments.forEach(function (ind) {
                        if(_.includes(current, ind.display_name) || mainSeriesName === ind.display_name) ind.dont_show = true;
                        else delete ind.dont_show;
                    });
                });
            });

            state.overlays.array = marketData;
            state.overlays.current = current;
        });
    }

    var first_time = true;
    return {
      openDialog : function( containerIDWithHash, title ) {
        init().then(function(){
            state.dialog.title = 'Add/remove comparisons'.i18n() + (title ? ' - ' + title : '');
            state.dialog.container_id = containerIDWithHash;
            state.overlays.current = $(containerIDWithHash).data('overlays-current') || [];

            var chart = $(containerIDWithHash).highcharts();
            update_overlays(chart);
            var normal_open = first_time || getParameterByName("affiliates") == 'true';
            win.dialog('open');
            first_time = false;
        }).catch(console.error.bind(console));
      }
    }

});
