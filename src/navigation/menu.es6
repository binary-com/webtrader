/**
 * Created by amin on October 30, 2015.
 */
import $ from 'jquery';
import _ from 'lodash';
import navigation from './navigation';
import '../common/util';

/* recursively creates menu into root element, set on_click to register menu item clicks */
const refreshMenuRecursive = ( root, data , on_click) => {
   data.forEach((value) => {
      const isDropdownMenu = value.submarkets || value.instruments;
      const caretHtml = "<span class='nav-submenu-caret'></span>";
      const menuLinkHtml = isDropdownMenu ? value.display_name + caretHtml : value.display_name;
      const $menuLink = $("<a href='#'>" + menuLinkHtml + "</a>");
      if(value.is_disabled)  $menuLink.addClass('disabled');

      const newLI = $("<li>").append($menuLink);
      if(!isDropdownMenu) {
         newLI.data(value); /* example use => newLI.data('symbol'), newLI.data('delay_amount'), newLI.data('display_name') */
      }
      newLI.appendTo( root);

      if (isDropdownMenu) {
         const newUL = $("<ul>");
         newUL.appendTo(newLI);
         refreshMenuRecursive( newUL, value.submarkets || value.instruments, on_click );
      }
      else if(on_click && !value.is_disabled)
         $menuLink.click(function () {
            /* pass the <li> not the <a> tag */
            const li = $(this).parent();
            on_click(li);
         });
   });
}

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

      const rank = { "forex": 1, "indices": 2, "stocks": 3, "commodities": 4, "volidx": 5 };
      markets = _.sortBy( markets, (o) => rank[o.name.toLowerCase()]);
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

export const refreshMenu = (root,data,on_click) => {
   refreshMenuRecursive(root, data, on_click);
   navigation.updateDropdownToggles();
}

export default {
   extractChartableMarkets,
   extractFilteredMarkets,
   sortMenu,
   refreshMenu
};
