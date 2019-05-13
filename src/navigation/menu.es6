/**
 * Created by amin on October 30, 2015.
 */
import $ from 'jquery';
import _ from 'lodash';
import navigation from './navigation';
import '../common/util';

/* you can filter the symbols with the options parameter, for example:
   options: {
       filter: (sym) => (sym.feed_license !== 'realtime')
   }
*/
export const extractFilteredMarkets = (trading_times_data, options) => {
   const markets = trading_times_data.trading_times.markets.map((m) => {
      const market = {
         name: m.name,
         display_name: m.name
      };
      market.submarkets = m.submarkets.map((sm) => {
         const submarket = {
            name: sm.name,
            display_name: sm.name
         };
         let symbols = sm.symbols;
         if (options && options.filter) /* filter the symbols */
            symbols = symbols.filter(options.filter);
         submarket.instruments = symbols.map((sym) => {
            return {
               symbol: sym.symbol,
               display_name: sym.name,
               delay_amount: sym.delay_amount || 0,
               events: sym.events,
               times: sym.times,
               settlement: sym.settlement,
               feed_license: sym.feed_license || 'realtime'
            };
         });
         return submarket;
      })
      /* there might be a submarket (e.g "Americas") which does not have any symbols after filtering */
         .filter(
            (sm) => (sm.instruments.length > 0)
         );
      return market;
   });

   return markets;
};

export const extractChartableMarkets = (trading_times_data) => {
   return extractFilteredMarkets(trading_times_data, {
      filter: (sym) => (sym.feed_license !== 'chartonly')
   }) || [];
};

export const sortMenu = (markets) => {
   const sort_fn = sortAlphaNum('display_name');
   //Sort market
   if($.isArray(markets)) {

      const rank = { "forex": 1, "indices": 2, "otc stocks": 3, "commodities": 4, "volatility indices": 5 };
      markets = _.sortBy( markets, (o) => rank[o.display_name.toLowerCase()]);
      markets.forEach((market) => {
         if($.isArray(market.submarkets)) {
            // Sort sub-markets
            market.submarkets.sort(sort_fn);
            market.submarkets.forEach((submarket) => {
               if($.isArray(submarket.instruments)) {
                  // Sort instruments
                  submarket.instruments.sort(sort_fn);
               }
            });
         }
      });
   }
   return markets;
};

export const refreshMenu = (root, markets, callback) => {
   const menu = `<ul>${
      markets.map(m => `<li><div>${m.display_name}</div><ul>${
         m.submarkets.map(s => `<li><div>${s.display_name}</div><ul>${
            s.instruments.map(i => `<li symbol='${i.symbol}' pip='${i.pip}'><div>${i.display_name}</div></li>`).join('')
         }</ul></li>`).join('')
      }</ul></li>`).join('')
   }</ul>`;
   const $menu = $(menu);
   root.find('> ul').menu('destroy').remove();
   root.append($menu);
   $menu.find('li[symbol]').on('click', (e,a) => {
      const display_name = $(e.target).text();
      const $li = $(e.target).closest('li');
      const symbol = $li.attr('symbol');
      const pip = $li.attr('pip');
      $menu.detach();
      root.append($menu);
      callback(symbol, display_name, pip);
   });
   $menu.menu({ position: { collision: 'fit' } });
}

export default {
   extractChartableMarkets,
   extractFilteredMarkets,
   sortMenu,
   refreshMenu
};
