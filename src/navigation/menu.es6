import $ from 'jquery';
import '../common/util';
import "jquery-growl";

/* you can filter the symbols with the options parameter, for example:
   options: {
       filter: (sym) => (sym.feed_license !== 'realtime')
   }
*/
const menu_config = {
   trade : '.trade a',
   instruments : '.instruments a',
   assetIndex : '.assetIndex',
   tradingTimes : '.tradingTimes',
};

const trade_messages = {
   no_symbol : () => "Trading options isn’t possible in your country.".i18n(),
};

export const extractFilteredMarkets = (trading_times_data, options) => {
   if (trading_times_data) {
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
   }
};

export const extractChartableMarkets = (trading_times_data) => {
   return extractFilteredMarkets(trading_times_data, {
      filter: (sym) => (sym.feed_license !== 'chartonly')
   }) || [];
};

export const refreshMenu = (root, markets, callback) => {
   
   if(markets.length == 0){
      Object.values(menu_config).map( menu => $(menu).addClass('disabled'));
      $.growl.error({message: trade_messages.no_symbol()});
   } else if(markets.length == 3) {
      $.growl.error({message: trade_messages.no_symbol()});
   } else {
      Object.values(menu_config).map( menu => $(menu).removeClass('disabled'));
   }
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
   refreshMenu
};
