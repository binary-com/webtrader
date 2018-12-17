import $ from 'jquery';
import windows from 'windows/windows';
import liveapi from 'websockets/binary_websockets';
import menu from 'navigation/menu';
import 'datatables';
import 'jquery-growl';
import _ from 'lodash';
import moment from 'moment';

let table = null;
let tradingWin = null;
let select = null;
let sub_select = null;

const processData = (markets) => {
   markets = markets || [];
   const market_names = [];
   const submarket_names = { };
   markets
    .filter(eMarket => {
      const loginId = (local_storage.get('authorize') || {}).loginid || '';
      return (/MF/gi.test(loginId) && eMarket.name !== 'Volatility Indices')
        || (/MLT/gi.test(loginId) && eMarket.name === 'Volatility Indices')
        || (/MX/gi.test(loginId) && eMarket.name === 'Volatility Indices')
        || (!/MF/gi.test(loginId) && !/MLT/gi.test(loginId) && !/MX/gi.test(loginId));
    })
    .forEach((market) => {
      market_names.push(market.display_name);
      submarket_names[market.display_name] = [];
      market.submarkets.forEach(
        (submarket) => submarket_names[market.display_name].push(submarket.display_name)
     )
   });

  return {
    market_names: market_names,
    submarket_names: submarket_names,
    /* get the rows for this particular marketname and sumbarket_name */
    getRowsFor: function(marketname, submarket_name) {
      // TODO: comeback and use lodash once 'trade module' changes got merged.
      const market = markets.filter((m) => (m.display_name == marketname))[0];
      const symbols = market && market.submarkets.filter((s) => (s.display_name == submarket_name))[0].instruments;
      const rows = (symbols || []).map((sym) => {
        return [
          sym.display_name,
          sym.times.open[0],
          sym.times.close[0],
          sym.times.settlement || sym.settlement || '-',
          (sym.events && sym.events.length > 0) ?
            sym.events
              .map(({descrip, dates}) => `${descrip}: ${dates}`)
              .join('<br>')
            : '-',
        ];
      });
      return rows;
    }
  };
}

const getMarketsSubmarkets = (active_symbols) => {
   const select_market_submarket = active_symbols.reduce((market_result, market) => {
       const { market_display_name, submarket_display_name, display_name } = market;

       market_result[market_display_name] = market_result[market_display_name] || {};
       market_result[market_display_name][submarket_display_name] = market_result[market_display_name][submarket_display_name] || [];
       market_result[market_display_name][submarket_display_name].push(display_name);

       return market_result;
   }, {})

   return select_market_submarket
}

export const init = ($menuLink) => {
   require(["css!tradingtimes/tradingTimes.css"]);
   $menuLink.click(() => {
      if (!tradingWin) {
         tradingWin = windows.createBlankWindow($('<div/>'), {
            title: 'Trading Times'.i18n(),
            dialogClass: 'tradingTimes',
            width: 800,
            height: 400,
         });
         tradingWin.track({
            module_id: 'tradingTimes',
            is_unique: true,
            data: null
         });
         tradingWin.dialog('open');
         require(['text!tradingtimes/tradingTimes.html'], initTradingWin);
      }
      else
         tradingWin.moveToTop();
   });
}

const initTradingWin = ($html) => {
   $html = $($html).i18n();
   const subheader = $html.filter('.trading-times-sub-header');
   table = $html.filter('table');
   $html.appendTo(tradingWin);

   table = table.dataTable({
      data: [],
      "columnDefs": [
         { className: "dt-body-center dt-header-center", "targets": [ 0,1,2,3,4 ] }
      ],
      paging: false,
      ordering: false,
      searching: true,
      processing: true
   });
   table.parent().addClass('hide-search-input');

   // Apply the a search on each column input change
   table.api().columns().every(function () {
      const column = this;
      $('input', this.header()).on('keyup change', function () {
         if (column.search() !== this.value)
            column.search(this.value) .draw();
      });
   });

   let market_names = null,
      submarket_names = null,
      changedFn = null;

   const refreshTable = (yyyy_mm_dd) => {
      /* update the table with the given marketname and submarketname */
      const updateTable = (result, market_name,submarket_name) => {
         const rows = result.getRowsFor(market_name, submarket_name);
         table.api().rows().remove();
         table.api().rows.add(rows);
         table.api().draw();
      }

      /* refresh the table with result of {trading_times:yyyy_mm_dd} from WS */
      const refresh = (data) => {
         const result = processData(menu.extractFilteredMarkets(data[1]));
         const header = getMarketsSubmarkets(data[0].active_symbols);

         marketDropdown();
         submarketDropdown();
         updateTable(result, market_names.val(), submarket_names.val());

         function changed() {
            const val = $(this).val();

            if (header[val]) submarket_names.update_list(Object.keys(header[val]));

            updateTable(result, market_names.val(), submarket_names.val());
         };

         function marketDropdown() {
            if (market_names == null) {
               const select = $('<select />');
               select.appendTo(subheader);
               market_names = windows.makeSelectmenu(select, {
                  list: Object.keys(header),
                  inx: 0,
               });

               market_names.off('selectmenuchange', changed);
               market_names.on('selectmenuchange', changed);
            } else {
               market_names.update_list(Object.keys(header));
               market_names.off('selectmenuchange', changed);
               market_names.on('selectmenuchange', changed);
            }
         }

         function submarketDropdown() {
            if (submarket_names == null) {
               const sub_select = $('<select />');
               sub_select.appendTo(subheader);
               submarket_names = windows.makeSelectmenu(sub_select, {
                  list: Object.keys(header[market_names.val()]),
                  inx: 0,
                  changed: changedFn,
               });
               submarket_names.off('selectmenuchange', changed);
               submarket_names.on('selectmenuchange', changed);
            } else {
               submarket_names.update_list(Object.keys(header[market_names.val()]));
               submarket_names.off('selectmenuchange', changed);
               submarket_names.on('selectmenuchange', changed);
            }
         }
      };

      const getCachedData = () => {
        const active_symbols_request = { active_symbols: 'brief' };
        const asset_index_request = { trading_times: yyyy_mm_dd };

        const processing_msg = $('#' + table.attr('id') + '_processing').show();

        Promise.all(
            [
                liveapi.cached.send(active_symbols_request),
                liveapi.cached.send(asset_index_request),
            ])
            .then((results) => {
                refresh(results);
                processing_msg.hide();
            })
            .catch((error) => {
                $.growl.error({ message: error.message });
                processing_msg.hide();
            });
      };

      getCachedData();
      require(['websockets/binary_websockets'], (liveapi) => {
          liveapi.events.on('login', getCachedData);
          liveapi.events.on('logout', getCachedData);
       });
   }

   refreshTable(moment.utc().format('YYYY-MM-DD'));
   const maxDate = moment.utc().add(1, 'years').toDate();
   tradingWin.addDateToHeader({
      title: 'Date: ',
      date: moment.utc().toDate(),
      changed: refreshTable,
      maxDate,
   });
}

export default {
   init
}
