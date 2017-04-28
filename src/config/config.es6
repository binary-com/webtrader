/**
* Created by arnab on 5/12/16.
*/
import $ from 'jquery';
import windows from '../windows/windows';
import rv from '../common/rivetsExtra';
import _ from 'lodash';
import '../common/util';
import html from 'text!./config.html';
import 'css!./config.css';

let win = null, win_view = null;

const initConfigWindow = () => {
   const root = $(html).i18n();
   const state = init_state(root);
   win_view = rv.bind(root[0], state);

   win = windows.createBlankWindow(root, {
      title: 'Change Backend Server'.i18n(),
      resizable: false,
      collapsable: false,
      minimizable: false,
      maximizable: false,
      modal: true,
      ignoreTileAction:true,
      open: () => {
         const config = local_storage.get('config');
         if(config && config.app_id) state.app_id = config.app_id;
         if(config && config.websocket_url) state.websocket_url = _.replace(_.replace(config.websocket_url || '', 'wss://', ''), '/websockets/v3?l=EN', '');
         if(config && config.oauth_url) state.oauth_url = _.replace(_.replace(config.oauth_url || '', 'https://', ''), '/oauth2/authorize', '');
      },
      close: () => {
         win_view && win_view.unbind();
         win && win.dialog('destroy').remove();
         win_view = win = null;
      },
      buttons: [
         {
            text: 'Apply'.i18n(),
            icons: { primary: 'ui-icon-check' },
            click: state.apply
         },
         {
            text: 'Reset to Defaults'.i18n(),
            icons: { primary: 'ui-icon-refresh' },
            click: state.reset
         }
      ]
   });

   win.dialog( 'open' );
}

const init_state = (root) => {
   const state = {
      websocket_url: 'ws.binaryws.com',
      oauth_url: 'oauth.binary.com',
      app_id: ''
   };

   state.apply = () => {
      const lang = (local_storage.get('i18n') || {value:'en'}).value;
      const config = {
         websocket_url: 'wss://' + state.websocket_url + '/websockets/v3?l=' + lang,
         oauth_url: 'https://' + state.oauth_url + '/oauth2/authorize',
         app_id: state.app_id
      }
      local_storage.set('config', config);
      state.reload_page();
   }

   state.reset = () => {
      local_storage.remove('config');
      state.reload_page();
   }

   state.reload_page = () => {
      $.growl.notice({message: 'Config changes successful.<br/>Reloading page ...'.i18n()});
      setTimeout(() => {
         window.location.reload();
      }, 900);
   }

   return state;
}


export const init = ($menuLink) => {
   $menuLink.click(() => {
      if (!win)
         initConfigWindow();
      else
         win.moveToTop();
   });
}

export default { init }
