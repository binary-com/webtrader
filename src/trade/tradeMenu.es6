import $ from 'jquery';
import liveapi from '../websockets/binary_websockets';
import menu from '../navigation/menu';
import { getSortedMarketSubmarkets } from '../common/marketUtils';
import "jquery-growl";

const show_error = (err) => {
   $.growl.error({ message: err.message });
   console.error(err);
};

const get_active_symbol = (landing_company, country) => {
   liveapi
      .send({ active_symbols: 'brief' })
      .then((data) => {
         /* clean up the data! */
         const active_symbols = data.active_symbols;
         let markets = _(active_symbols).groupBy('market').map((symbols) => {
            const active_symbols = symbols;
            const sym = _.head(active_symbols);
            const market = { name: sym.market, display_name: sym.market_display_name };
            market.submarkets = _(active_symbols).groupBy('submarket').map((symbols) => {
               const sym = _.head(symbols);
               const submarket = { name: sym.submarket, display_name: sym.submarket_display_name };
               submarket.instruments = _.map(symbols, (sym) => ({
                  symbol: sym.symbol,
                  display_name: sym.display_name,
                  is_disabled: sym.is_trading_suspended || !sym.exchange_is_open,
                  pip: sym.pip
               })
               );
               submarket.is_disabled = _.every(submarket.instruments, 'is_disabled');
               return submarket;
            }).value();
            market.is_disabled = _.every(market.submarkets, 'is_disabled');
            return market;
         }).value();
         markets = getSortedMarketSubmarkets(markets);        
         const trade = $("#nav-menu").find(".trade");
         menu.refreshMenu(trade, markets, (symbol, display_name, pip) => {
            liveapi
               .send({ contracts_for: symbol })
               .then((res) => {
                  require(['trade/tradeDialog'],
                     (tradeDialog) => tradeDialog.init({ symbol, display_name, pip }, res.contracts_for)
                  );
               }).catch(show_error);
         });
      })
      .catch(show_error);
}

const refresh_active_symbols = () => {
   if (local_storage.get('oauth')) {
      liveapi
         .cached
         .authorize()
         .then(() => {
            const country = local_storage.get('authorize').country;
            liveapi
            .cached
            .send({ landing_company: country })
            .then((data) => {
               const landing_company = data.landing_company
               get_active_symbol(landing_company, country);
            });
         })
   } else{
      get_active_symbol();
   }
}

export const init = () => {
   require(['trade/tradeDialog']); // Trigger loading of tradeDialog
   refresh_active_symbols();
   require(['websockets/binary_websockets'], (liveapi) => {
      liveapi.events.on('login', refresh_active_symbols);
      liveapi.events.on('logout', refresh_active_symbols);
   });
}

export default { init };
