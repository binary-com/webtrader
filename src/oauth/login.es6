import liveapi from '../websockets/binary_websockets';
import windows from '../windows/windows';
import rv from '../common/rivetsExtra';
import _ from 'lodash';
import html from 'text!./login.html';
import 'css!./login.css';

let login_win = null;
let login_win_view = null; // rivets view

export function login() {
      const app_id = liveapi.app_id;
      const hostname = new URL(window.location.href).hostname;
      const domain_extension = hostname.includes('binary.me') ? '.me' : '.com';
      const login_url = liveapi.server_url.includes('qa') ? liveapi.server_url : `oauth.binary${domain_extension}`;
      const lang = (local_storage.get('i18n') || { value:'en' }).value;
      const oauth_url = `https://${login_url}/oauth2/authorize?app_id=${app_id}&l=${lang}`;
      window.location = oauth_url;
}

export const init = () => {
   if(login_win){
      login_win.moveToTop();
      return;
   }

   const root = $(html).i18n();
   login_win = windows.createBlankWindow(root, {
      title: 'Log in',
      resizable:false,
      collapsable:false,
      minimizable: false,
      maximizable: false,
      width: 548,
      height: 'auto',
      close: () => {
         login_win.dialog('destroy');
         login_win.remove();
         login_win = null;
      },
      open: () => { },
      destroy: () => {
         login_win_view && login_win_view.unbind();
         login_win_view = null;
      }
   });
   login_win.parent().css('overflow', 'visible');

   init_state(root, login_win);
   login_win.dialog('open');

   /* update dialog position, this way when dialog is resized it will not move*/
   const offset = login_win.dialog('widget').offset();
   offset.top = 120;
   login_win.dialog("option", "position", { my: offset.left, at: offset.top });
   login_win.dialog('widget').css({
      left: offset.left + 'px',
      top: offset.top + 'px'
   });
   login_win.dialog('widget').find('.ui-selectmenu-menu ul').css('max-height', '320px');
}

const init_state = (root, win) => {
   const state = {
      login_button_disabled: false,
      login: () => {
         state.login_button_disabled = true;
         login();
      },
      onRegister: () => {
         const register_link = getBinaryUrl('home.html');
         window.open(register_link, '_blank');
      },
   };

   login_win_view = rv.bind(root[0], state);
}

export default {
   init,
   login
}
