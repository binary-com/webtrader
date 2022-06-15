import html_menu from 'text!./workspace-menu.html';
import html from 'text!./workspace.html';
import rv from '../common/rivetsExtra';
import $ from 'jquery';
import 'jquery-growl';
import 'css!./workspace-menu.css';
import 'css!./workspace.css';
import liveapi from '../websockets/binary_websockets';
import windows from '../windows/windows';
import tracker from '../windows/tracker';

const INITIAL_WORKSPACE_NAME = 'my-workspace-1';
(() => {
   const states = local_storage.get('states');
   if(states && !states.name) {
      states.name = INITIAL_WORKSPACE_NAME;
      local_storage.set('states', states);
   }
})();

const clone = obj => JSON.parse(JSON.stringify(obj));

const sanitize = value => value.replace(/("|'|\&|\(|\)|\<|\>|\;)/g, '');

const state = {
   route: 'active', // one of ['active', 'saved', 'rename', 'saveas']
   closeAll: () => $('.webtrader-dialog').dialog('close'),
   workspaces: local_storage.get('workspaces') || [],
   dialogs: [ ],
   update_route: route => state.route = route,
   tileDialogs: () => tileDialogs(),
   workspace: {
      remove: w => {
         const inx = state.workspaces.indexOf(w);
         inx !== -1 && state.workspaces.splice(inx, 1);
         local_storage.set('workspaces', state.workspaces);
      },
      show: w => {
         let needsAuthentication = w.tradeDialog && w.tradeDialog.length;
         needsAuthentication = needsAuthentication || w.portfolio || w.statement || w.profitTable 
                              || w.deposit || w.withdraw;
         if(needsAuthentication && !liveapi.is_authenticated()) {
            $.growl.notice({ message: 'Please log in to see your saved workspace.'.i18n() });
            return;
         }
         state.closeAll();
         manager_win.dialog('close');
         _.delay(() => {
            state.current_workspace.name = sanitize(w.name);
            local_storage.set('states', w);
            tracker.reopen(clone(w));
         }, 500);
      },
      prev_name: '',
      save_name: w => state.workspace.prev_name = sanitize(w.name),
      blur: el => el.blur(),
      rename: w => {
        const prev_name = sanitize(state.workspace.prev_name);
        const current_workspace = state.current_workspace;
        if(!w.name || state.workspaces.filter(wk => wk.name === w.name).length >= 2)
          w.name = state.workspace.prev_name;
        local_storage.set('workspaces', state.workspaces);
        if(current_workspace.name === prev_name) {
          current_workspace.name = sanitize(w.name);

          const states = local_storage.get('states');
          states.name = sanitize(w.name);
          local_storage.set('states', states);
        }
      }
   },
   current_workspace: {
      name: sanitize((local_storage.get('states') || {  }).name || 'workspace-1'),
      name_prev_value: '',
      is_saved: () => {
         const result = _.findIndex(state.workspaces, {name: sanitize(state.current_workspace.name)}) !== -1;
         return result;
      },
      save: () => {
         const {name, is_saved} = state.current_workspace;
         if(!is_saved()) {
            return state.saveas.show();
         }
         const workspace = local_storage.get('states');
         if (workspace) {
            workspace.name = sanitize(name);
            const inx = _.findIndex(state.workspaces, {name: workspace.name});
            state.workspaces[inx] = workspace;
            state.workspaces = clone(state.workspaces);
            local_storage.set('workspaces', state.workspaces);
            $.growl.notice({ message: 'Workspace changes saved'.i18n() });
         }
      }
   },
   rename: {
      show: () => {
         state.current_workspace.name_prev_value = sanitize(state.current_workspace.name);
         state.route = 'rename';
      },
      apply: () => { 
         let {name, name_prev_value} = state.current_workspace;
         if(!name || name === name_prev_value) { 
            return state.rename.cancel();
         }
         if(_.find(state.workspaces, {name: name})) {
            const matches = name.match(/\d+$/);
            let number = matches ? parseInt(matches[0]) : 0;
            name = name.replace(/\d+$/, '');
            while(_.find(state.workspaces, {name: name + number}))
               number += 1;
            name = name + number;
         }
         const workspace = _.find(state.workspaces, {name: name_prev_value});
         if(workspace) {
            workspace.name = name;
            state.workspaces = state.workspaces;
            local_storage.set('workspaces', state.workspaces);
         }
         const states = local_storage.get('states');
         states.name = name;
         local_storage.set('states', states);

         state.current_workspace.name = sanitize(name);
         state.route = 'active';
      },
      change: () => {
         state.current_workspace.name = sanitize(state.current_workspace.name);
      },
      cancel: () => {
         state.current_workspace.name = sanitize(state.current_workspace.name_prev_value);
         state.route = 'active';
      }
   },
   saveas: {
      show: () => {
        if (state.route !== 'saveas') {
          state.current_workspace.name_prev_value = sanitize(state.current_workspace.name);
          state.route = 'saveas';
        }
        else {
          state.route = 'active';
        }
      },
      apply: () => { 
         let {name, name_prev_value} = state.current_workspace;
         if(!name) { 
            return state.saveas.cancel();
         }
         if(_.find(state.workspaces, {name: name})) {
            const matches = name.match(/\d+$/);
            let number = matches ? parseInt(matches[0]) : 0;
            name = name.replace(/\d+$/, '');
            while(_.find(state.workspaces, {name: name + number}))
               number += 1;
            name = name + number;
         }
         const workspace = local_storage.get('states');
         workspace.name = name;
         state.workspaces.push(workspace);
         local_storage.set('workspaces', state.workspaces);

         state.current_workspace.name = name;
         state.route = 'active';
         $.growl.notice({ message: "Added new workspace %".i18n().replace('%', `<b>${name}</b>`) });
      },
      cancel: () => state.rename.cancel()
   },
   file: {
      hash_code: (s) => JSON.stringify(s).split("").reduce((a,b) => {a=((a<<5)-a)+b.charCodeAt(0);return a&a},0),
      open_selector: (e) => {
         const $root = $(e.target).closest('.workspace-manager-dialog');
         $root.find("input[type=file]").click();
      },
      upload: (event) => {
         // const _this = this;
         const file = event.target.files[0];
         event.target.value = null;
         if(!file) { return; }

         const reader = new FileReader();
         reader.onload = (e) => {
            const contents = e.target.result;
            // const array = local_storage.get("trade-templates");
            let data = null;
            try{
               data = JSON.parse(contents);
               data.name = sanitize(data.name);
               const hash = data.random;
               delete data.random;
               if(hash !== state.file.hash_code(data)){ throw "Invalid JSON file".i18n(); }
               if(data.template_type !== 'workspace-template') { throw "Invalid template type.".i18n(); }
            } catch(e) {
               $.growl.error({message:e});
               return;
            }

            if(_.find(state.workspaces, {name: data.name})) {
               const matches = name.match(/\d+$/);
               $.growl.error({message: "Template name already exists".i18n()});
               return; // don't apply the same workspace
            }
            delete data.template_type;
            delete data.random;
            state.workspaces.push(data);
            local_storage.set('workspaces', state.workspaces);

            state.workspace.show(data);

            $.growl.notice({message: "Successfully added workspace as ".i18n() + "<b>" + data.name + "</b>"});
         }

         reader.readAsText(file);
      },
      download: (w) => {
         const {name} = w;
         const inx = _.findIndex(state.workspaces, {name: name});
         const workspace = inx !== -1 ? state.workspaces[inx] : local_storage.get('states');
         workspace.name = sanitize(name);
         workspace.template_type = 'workspace-template';
         workspace.random = state.file.hash_code(workspace)
         var json = JSON.stringify(workspace);
         downloadFileInBrowser(workspace.name + '.json', 'text/json;charset=utf-8;', json);
         $.growl.notice({message: "Downloading workspace as %1".i18n().replace("%1", `<b>${workspace.name}.json</b>`)});
      }
   }
};
state.current_workspace.root = state;
let manager_win = null;
let manager_view = null;
const openManager = () => {
  const $html = $(html).i18n();
  const close = () => {
    manager_view && manager_view.unbind();
    manager_view = null;
    manager_win && manager_win.destroy();
    manager_win = null;
  };
  manager_win = windows.createBlankWindow($html, {
    title: 'Manage'.i18n(),
    width: 400,
    height: 250,
    resizable: false,
    collapsable: false,
    minimizable: false,
    maximizable: false,
    draggable: false,
    modal: true,
    close: close,
    ignoreTileAction:true,
    'data-authorized': true,
    create:() => $('body').css({ overflow: 'hidden' }),
    beforeClose: () => $('body').css({ overflow: 'inherit' })
  });
  manager_view = rv.bind($html[0], state);
  manager_win.dialog('open');
}

export const init = (parent) => {
   const state = {
     closeAll: () => $('.webtrader-dialog').dialog('close'),
     tileDialogs: () => tileDialogs(),
     showWorkspaceManager: () => {
       openManager();
     }
   };
   const root = $(html_menu);
   parent.append(root);
   rv.bind(root[0], state);
}
export const addDialog = (name, id, clickCb, removeCb) => {
   const row = {
      name: name,
      id: id,
      click: () => {
        manager_win && manager_win.dialog('close');
        clickCb();
      },
      remove: () => { cleaner(); removeCb(); } 
   };
   const cleaner = () => {
      const inx = state.dialogs.indexOf(row);
      inx !== -1 && state.dialogs.splice(inx, 1);
   }
   state.dialogs.push(row);
   return cleaner;
}

export const removeDialog = (id) => {
   state.dialogs = state.dialogs.filter( item => item.id !== id);
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
     // https://trello.com/c/NUzJ7nRn/947-chart-auto-scroll
      // shuffle(dialogs); // shuffle dialogs
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

export default { init, addDialog, removeDialog, events, tileDialogs };
