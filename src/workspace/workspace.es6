import html from 'text!./workspace.html';
import rv from '../common/rivetsExtra';
import $ from 'jquery';
import 'jquery-growl';
import 'css!./workspace.css';

const INITIAL_WORKSPACE_NAME = 'my-workspace-1';
(() => {
   const states = local_storage.get('states');
   if(!states.name) {
      states.name = INITIAL_WORKSPACE_NAME;
      local_storage.set('states', states);
   }
})();

const state = {
   route: 'all', // one of ['all', 'active', 'saved', 'rename']
   workspaces: local_storage.get('workspaces') || [],
   dialogs: [ ],
   update_route: route => state.route = route,
   tileDialogs: () => tileDialogs(),
   closeAll: () => $('.webtrader-dialog').dialog('close'),
   current_workspace: {
      name: (local_storage.get('states') || {  }).name || 'my-workspace-1',
      name_perv_value: '',
      save: () => {
         const {name} = state.current_workspace;
         const inx = _.findIndex(state.workspaces, {name: name});
         if(inx === -1) {
            return state.saveas.show();
         }
         const workspace = local_storage.get('states');
         workspace.name = name;
         state.workspaces[inx] = workspace;
         local_storage.set('workspaces', state.workspaces);
         $.growl.notice({ message: 'Workspace changes saved'.i18n() });
      }
   },
   rename: {
      show: () => {
         state.current_workspace.name_perv_value = state.current_workspace.name;
         state.route = 'rename';
      },
      apply: () => { 
         let {name, name_perv_value} = state.current_workspace;
         if(!name || name === name_perv_value) { 
            return state.rename.cancel();
         }
         if(_.find(state.workspaces, {name: name})) {
            const matches = name.match(/\d+$/);
            const number = matches ? parseInt(matches[0]) : 0;
            name = name.replace(/\d+$/, '') + (number + 1);
         }
         const workspace = _.find(state.workspaces, {name: name_perv_value});
         if(workspace) {
            workspace.name = name;
            state.workspaces = state.workspaces;
            local_storage.set('workspaces', state.workspaces);
         }
         state.current_workspace.name = name;
         state.route = 'active';
      },
      cancel: () => {
         state.current_workspace.name = state.current_workspace.name_perv_value;
         state.route = 'active';
      }
   },
   saveas: {
      show: () => {
         state.current_workspace.name_perv_value = state.current_workspace.name;
         state.route = 'saveas';
      },
      apply: () => { 
         let {name, name_perv_value} = state.current_workspace;
         if(!name) { 
            return state.saveas.cancel();
         }
         if(_.find(state.workspaces, {name: name})) {
            const matches = name.match(/\d+$/);
            const number = matches ? parseInt(matches[0]) : 0;
            name = name.replace(/\d+$/, '') + (number + 1);
         }
         const workspace = local_storage.get('states');
         workspace.name = name;
         state.workspaces.push(workspace);
         local_storage.set('workspaces', state.workspaces);

         state.current_workspace.name = name;
         state.route = 'active';
      },
      cancel: () => state.rename.cancel()
   }
};

export const init = (parent) => {
   const root = $(html);
   parent.append(root);
   rv.bind(root[0], state);
}
export const addDialog = (name, clickCb, removeCb) => {
   const row = {
      name: name,
      click: () => clickCb(),
      remove: () => { cleaner(); removeCb(); } 
   };
   const cleaner = () => {
      const inx = state.dialogs.indexOf(row);
      inx !== -1 && state.dialogs.splice(inx, 1);
   }
   state.dialogs.push(row);
   return cleaner;
}

export const events = $('<div/>');

export const tileDialogs = () => {
   /* shuffle the given array */
   const shuffle = (array) => {
      let temp, rand_inx;

      for (let inx = array.length; inx > 0;) {
         rand_inx = Math.floor(Math.random() * inx);
         --inx;
         temp = array[inx];
         array[inx] = array[rand_inx];
         array[rand_inx] = temp;
      }

      return array;
   }

   // get array of dialogs
   var dialogs = $('.webtrader-dialog').filter((inx, d) => {
      /* check to see if initialized and is visible */
      const $d = $(d);
      return $d.hasClass("ui-dialog-content") && $d.dialog("isOpen") &&
            !$d.hasClass('ui-dialog-minimized') && ($(window).width() >= $d.dialog('option', 'width'));
   });


   const arrange = (dialogs, perform) => {
      let total_free_space = 0;

      const max_x = $(window).width();
      let y = 115; // position of the next window from top
      if($("#msg-notification").is(":visible"))
            y = 150;

      for (var inx = 0; inx < dialogs.length;) {
         var inx_start = inx;
         var row_height = 0; // height of the current row of dialogs
         var x = 0; // positon of the next window from left

         for (;/* see which which dialogs fit into current row */;) {
            if (inx == dialogs.length)
               break;
            const d = $(dialogs[inx]);
            const w = d.dialog('option', 'width'),
               h = d.dialog('option', 'height');
            row_height = Math.max(row_height, h);
            if (x + w <= max_x) {
               x += w;
               ++inx;
            }
            else
               break;
         }

         /* divide the vertical space equally between dialogs. */
         const free_space = x < max_x ? (max_x - x) : 0;
         let margin_left = x < max_x ? (max_x - x) / (inx - inx_start + 1) : 0; /* the current window might be wider than screen width */
         if(inx != dialogs.length) { /* we don't care about extra space at last row */
            total_free_space += free_space;
         }
         if (x === 0 && $(dialogs[inx]).dialog('option', 'width') > max_x) {
            ++inx;
            margin_left = 0;
         };
         x = 0;
         for (var j = inx_start; j < inx; ++j) {
            x += margin_left;
            const d = $(dialogs[j]);
            const w = d.dialog('option', 'width'),
               h = d.dialog('option', 'height');

            if(perform) /* are we testing or do we want to arrange elements */
               d.dialog('widget').animate({
                  left: x + 'px',
                  top: y + 'px'
               }, 1500, d.trigger.bind(d, 'animated'));
            /* update dialog option.position */
            d.dialog("option", "position", { my: x, at: y });
            x += w;
         };
         y += row_height + 20;
      }
      return total_free_space;
   }

   /* we will try 100 different arrangements and pick the best one */
   let best = null,
      best_free_space = 1000*1000;
   for (var i = 0; i < 100; ++i) {
      shuffle(dialogs); // shuffle dialogs
      var total_free_space = arrange(dialogs, false);
      if (total_free_space < best_free_space) {
         best = dialogs.slice(); // clone the array
         best_free_space = total_free_space;
      }
   }
   // get array of large dialogs (larger than window size)
   const largeDialogs = $('.webtrader-dialog').filter(function (inx, d) {
      /* check to see if initialized and is visible */
      const $d = $(d);
      return $d.hasClass("ui-dialog-content") && $d.dialog("isOpen") && !$d.hasClass('ui-dialog-minimized') && ($(window).width() < $d.dialog('option', 'width'));
   });
   _(largeDialogs).forEach(function (d) {
      best.push(d);
   });
   arrange(best, true);

   setTimeout(() => events.trigger('tile'), 1600);
}

export default { init, addDialog, events, tileDialogs };
