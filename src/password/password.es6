/*
 * Created by amin on May 19, 2016.
 */

import liveapi from '../websockets/binary_websockets';
import windows from '../windows/windows';
import rv from '../common/rivetsExtra';
import _ from 'lodash';
import html from 'text!./password.html';
import 'css!./password.css';

let password_win = null;
let password_win_view = null;

export const init = ($menuLink) => {
   $menuLink.click(() => {
      if (!password_win)
         init_password_win();
      else
         password_win.moveToTop();
   });
}

const init_password_win = () => {
   const root = $(html).i18n();
   password_win = windows.createBlankWindow(root, {
      title: 'Change password'.i18n(),
      resizable:false,
      collapsable:false,
      minimizable: false,
      maximizable: false,
      // width: 408,
      height: 350,
      'data-authorized': true,
      close: () => {
         password_win.dialog('destroy');
         password_win.remove();
         password_win = null;
      },
      open: () => { },
      destroy: () => {
         password_win_view && password_win_view.unbind();
         password_win_view = null;
      }
   });

   init_state(root);
   password_win.dialog('open');
}

const init_state = (root) => {
   const state = {
      empty_fields: {
         validate: false,
         clear: _.debounce(() => {
            state.empty_fields.validate = false;
         }, 2000),
         show: () => {
            state.empty_fields.validate = true;
            state.empty_fields.clear();
         }
      },
      account: {
         password: '',
         new_password: '',
         verify_password: ''
      },
      btn: {
         disabled: false,
      },

   };

   state.password_error_message = () => {
      const password = state.account.new_password;
      if(password === '') return state.empty_fields.validate ? '* Please enter your new password'.i18n() : '';
      if(password.length < 6) return '* Password must be 6 characters minimum'.i18n();
      if(!/\d/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
         return '* Password must contain uppercase letters and numbers'.i18n();
      }
      return '';
   };

   state.btn.change = () => {
      state.empty_fields.show();
      const account = state.account;
      if(state.account.password === ''
         || state.password_error_message() !== ''
         || state.account.new_password !== state.account.verify_password) {
         return;
      }
      const request = {
         change_password: 1,
         old_password: state.account.password,
         new_password: state.account.new_password
      };
      state.btn.disabled = true;
      liveapi.send(request)
         .then((data) =>{
            if(data.change_password !== 1){
               throw { message: 'Failed to update the password'.i18n()};
            }
            state.btn.disabled = false;
            $.growl.notice({ message: 'Password successfully updated.'.i18n()});
            $.growl.notice({ message: 'Redirecting to oauth login page,<br/>Please use your new password to login.'.i18n()});
            require(['oauth/login'], (login) => {
               _.defer(() => login.login(), 1000);
            });
            password_win.dialog('close');
         })
         .catch((err) => {
            state.btn.disabled = false;
            $.growl.error({ message: err.message});
         })
   }

   password_win_view = rv.bind(root[0], state);
}

export default { init }
