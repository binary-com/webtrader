/* created by arnab, on May 25, 2016 */
import liveapi from '../../websockets/binary_websockets';
import rv from '../../common/rivetsExtra';
import _ from 'lodash';
import html from 'text!./overlayManagement.html';
import 'css!./overlayManagement.css';

let win = null;
let win_view = null;
let state = {};

/* rviets formatter to filter indicators based on their category */
rv.formatters['overlays-filter'] = (array, search) => {
   search = search && search.toLowerCase();
   return array && array.filter(
      (ind) => ind.display_name.toLowerCase().indexOf(search) !== -1
   );
};

const init = () => {
   if(!win) {
      return init_dialog_async(html);
   }
   return Promise.resolve();
}

const init_dialog_async = (root) => {
   return new Promise((resolve, reject) => {
      root = $(root).i18n();

      let option = {
         title: 'Add/remove overlays'.i18n(),
         modal: true,
         destroy: () => {
            win_view && win_view.unbind();
            win_view = null;
            win.dialog('destroy').remove();
            win = null;
         },
         open: () => { },
      };

      /* affiliates route */
      if (isAffiliates()) {
         option = _.extend(option, {
            resizable: false,
            width: Math.min(480, $(window).width() - 10),
            height: 400,
            ignoreTileAction: true,
            maximizable: false,
            minimizable: false,
            collapsable: false,
         });
      } else {
         option = _.extend(option, {
            width: 700,
            // minHeight: 60,
         })
      }

      /* normal route */
      require(['windows/windows'], (windows) => {
         win = windows.createBlankWindow(root, option);
         init_state(root);
         resolve();
      });

   });
}

const init_state = (root) =>{
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

   state.overlays.clear_search = () => { state.overlays.search = ''; }

   state.overlays.add = (ovlay) => {
      const symbol = ovlay.symbol;
      const delay_amount = ovlay.delay_amount;
      const displaySymbol = ovlay.display_name;
      const containerIDWithHash = state.dialog.container_id;
      const mainSeries_timePeriod = $(containerIDWithHash).data("timePeriod");
      const dialog = $(containerIDWithHash);
      const type = dialog.data("type");

      //validate time period of the main series
      require(['charts/chartOptions', "charts/charts", "common/util"], (chartOptions, charts) => {
         const newTabId = containerIDWithHash.replace("#", "").replace("_chart", "");
         const dialog = $(containerIDWithHash);
         const fn = () => {
            dialog.data("overlayIndicator", true);
            chartOptions.disableEnableCandlestickAndOHLC( newTabId, false );
            charts.overlay(containerIDWithHash, symbol, displaySymbol, delay_amount)
               .then(() => {
                  const overlay = { symbol: symbol, displaySymbol: displaySymbol, delay_amount: delay_amount};
                  //Waiting for overlays to be applied.
                  _.defer(() => {
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
         win.dialog("close");
      });
   }

   state.overlays.remove = (ovlay) => {
      const containerIDWithHash = state.dialog.container_id;
      const dialog = $(containerIDWithHash);
      const chart = dialog.highcharts();
      if (chart && ovlay) {
         const series = _.find(chart.series, (s) => { return s.options.name === ovlay && s.options.id !== 'navigator'; });
         if (series) {
            const indicator_series = chart.get_indicator_series();
            //Remove current price line first
            series.removeCurrentPrice();
            //Then remove the series
            series.remove();
            //Re-validate chart
            _.defer(() => {
               let countInstrumentSeries = 0;
               chart.series.forEach((s) => {
                  if ((s.options.isInstrument || s.options.onChartIndicator) && s.options.id.indexOf('navigator') == -1) {
                     ++countInstrumentSeries;
                  }
               });
               if (countInstrumentSeries == 1) {
                  chart.series.forEach((s) => {
                     if ((s.options.isInstrument || s.options.onChartIndicator) && s.options.id.indexOf('navigator') == -1) {
                        s.update({
                           compare: undefined
                        });
                        $(containerIDWithHash).data('overlayIndicator', null);
                        require(['charts/chartOptions'], (chartOptions) => {
                           const newTabId = containerIDWithHash.replace("#", "").replace("_chart", "");
                           chartOptions.disableEnableCandlestickAndOHLC(newTabId, true);
                        });
                        _.defer(
                           () => {
                              require(["charts/charts"], (charts)=>{
                                 charts.refresh(containerIDWithHash); //Refresh chart when all the overlays are removed.
                              });
                           }
                        )
                        return false;
                     }
                  });
               }
               chart.set_indicator_series(indicator_series);
            });
         }

         let break_loop = false;
         state.overlays.array.forEach((market) => {
            market.submarkets.forEach((submarket) => {
               submarket.instruments.forEach((ind) => {
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

const update_overlays = (chart) => {
   require(['instruments/instruments'], (instruments) => {
      const mainSeriesName = chart.series[0].options.name;
      const current = _.filter(chart.series, (s, index) => {
         return s.options.isInstrument && s.options.id !== 'navigator' && index !== 0;
      }).map((s) => s.options.name) || [];

      const marketData = instruments.getMarketData() || [];
      marketData.forEach((market) => {
         market.submarkets.forEach((submarket) => {
            submarket.instruments.forEach((ind) => {
               if(_.includes(current, ind.display_name) || mainSeriesName === ind.display_name) ind.dont_show = true;
               else ind.dont_show = false;
            });
         });
      });

      state.overlays.array = marketData;
      state.overlays.current = current;
   });
}

let first_time = true;
export const openDialog = ( containerIDWithHash, title ) => {
   init().then(() => {
      state.dialog.title = 'Add/remove comparisons'.i18n() + (title ? ' - ' + title : '');
      state.dialog.container_id = containerIDWithHash;
      state.overlays.current = $(containerIDWithHash).data('overlays-current') || [];

      const chart = $(containerIDWithHash).highcharts();
      update_overlays(chart);
      const normal_open = first_time || isAffiliates();
      win.dialog('open');
      first_time = false;
   }).catch(console.error.bind(console));
}

export default { openDialog }

