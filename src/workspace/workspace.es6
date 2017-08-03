import html from 'text!./workspace.html';
import rv from '../common/rivetsExtra';
import 'css!./workspace.css';

export const init = (parent) => {
   const root = $(html);
   const state = {
      route: 'all', // one of ['all', 'active', 'saved', 'rename']
      workspaces: [
         {name: 'volatility workspace'},
         {name: 'fx aswesome'},
         {name: 'japon stuff'},
         {name: 'weekend setup'},
      ],
      dialogs: [
         {name: 'Platinum/USD'},
         {name: 'GBP/AUD'},
         {name: 'Hong Kong Index'},
         {name: 'Bombay Index'},
         {name: 'Airbus'},
         {name: 'USD/EUR'},
      ]
   }
   state.update_route = route => state.route = route;

   parent.append(root);
   rv.bind(root[0], state);
}

export default { init };
