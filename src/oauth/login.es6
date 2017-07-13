/*
 * Created by amin on May 1, 2016.
 */

import liveapi from '../websockets/binary_websockets';
import windows from '../windows/windows';
import rv from '../common/rivetsExtra';
import _ from 'lodash';
import html from 'text!./login.html';
import 'css!./login.css';

let login_win = null;
let login_win_view = null; // rivets view

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
   const app_id = liveapi.app_id;
   const state = {
      route: { value: 'login' },
      login: { disabled: false },
      registration: {
         email: '',
         disabled: false,
         validate: { value: false },
         email_show_explanation: () => {
            const email = state.registration.email;
            return (email === '' && !state.registration.validate.value) || validateEmail(email);
         },
      },
      account: {
         empty_fields: {
            validate: false,
            clear: _.debounce(() => {
               state.account.empty_fields.validate = false;
            }, 2000),
            show: () => {
               state.account.empty_fields.validate = true;
               state.account.empty_fields.clear();
            }
         },
         password_error_message: () => {
            const password = state.account.password;
            if(password === '') return state.account.empty_fields.validate ? 'You should enter between 6-25 characters.'.i18n() : '';
            if(password.length < 6) return 'Password must be 6 characters minimum'.i18n();
            if(!/\d/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password)) return 'Password must contain lower and uppercase letters with numbers'.i18n();
            return '';
         },
         verification: '',
         password: '',
         repeat_password:  '',
         residence: '',
         residence_list: [ { text: 'Indonesia', value: 'id'}],
         residence_unsupported: [],
         disabled: false, /* is button disabled */
      },
      confirm: { disabled: false }
   };

   state.login.login = () => {
      state.login.disabled = true;
      const config = local_storage.get('config');
      const lang = (local_storage.get('i18n') || {value:"en"}).value;
      const oauth_url = (config && config.oauth_url) || 'https://oauth.binary.com/oauth2/authorize';
      window.location =  oauth_url + '?app_id=' + app_id + '&l=' +lang;
   }

   state.confirm.confirm = () => {
      state.confirm.disabled = true;
      const config = local_storage.get('config');
      const oauth_url = (config && config.oauth_url) || 'https://oauth.binary.com/oauth2/authorize';
      window.location =  oauth_url + '?app_id=' + app_id;
   }

   state.route.update = (route) => {
      const routes = {
         login: {
            title: 'Log in'.i18n(),
            height: 180
         },
         registration: {
            title: 'Registration'.i18n(),
            height: 220,
         },
         account: {
            title: 'Account opening'.i18n(),
            height: 465
         },
         confirm: {
            title: 'Account opening'.i18n(),
            height: 415
         }
      };
      state.route.value = route;
      const title = routes[route].title;
      const height = routes[route].height;
      win.dialog('option', 'title', title);
      win.dialog('option', 'height', height);
   };

   state.registration.validate.clear = _.debounce(() => {
      state.registration.validate.value = false;
   }, 2000);

   state.registration.validate.show = () => {
      state.registration.validate.value = true;
      state.registration.validate.clear();
   }

   /* { verify_email: 'email' } step */
   state.registration.create = () => {
      const email = state.registration.email;
      if(email == '' || !validateEmail(email)) {
         state.registration.validate.show();
         return;
      }

      state.registration.disabled = true;
      liveapi.send({verify_email: email, type: 'account_opening'})
         .then((data) => {
            state.registration.disabled = false;
            if(data.verify_email) {
               $.growl.notice({ message: 'Verification code sent to '.i18n() + email });
               state.route.update('account');
            }
            else  {
               throw { message: 'Email verification failed ('.i18n() + data.msg_type + ')' };
            }
         })
         .catch((err) => {
            console.error(err);
            $.growl.error({ message: err.message });
            state.registration.disabled = false;
         });
   }

   /* { new_account_virtual: 1 } step */
   state.account.open = () => {
      state.account.empty_fields.show();
      const email = state.registration.email,
         verification = state.account.verification,
         password = state.account.password,
         repeat_password = state.account.repeat_password,
         residence = state.account.residence;
      let ok = validateEmail(email) && verification !== '' && password === repeat_password && password.length >= 6;
      ok = ok && /\d/.test(password) && /[a-z]/.test(password) && /[A-Z]/.test(password)  && residence.length === 2;

      if(!ok) { return; }

      const request = {
         new_account_virtual: 1,
         verification_code: verification,
         client_password: password,
         residence: residence,
         // affilate_token: '???'
      };
      state.account.disabled = true;
      liveapi.send(request)
         .then((data) => {
            const account = data.new_account_virtual;
            const oauth = [{id: account.client_id, token: account.oauth_token }];
            local_storage.set('oauth', oauth);
            state.account.disabled = false;
            liveapi.cached.authorize()
               .then(() => {
                  win.dialog('destroy'); 
                  win.remove();
                  login_win = null;
               })
               .catch(
                  (err) => console.error(err.message)
               );
            //state.route.update('confirm');
         })
         .catch((err) => {
            console.error(err);
            $.growl.error({ message: err.message });
            state.account.disabled = false;
         });
   }

   login_win_view = rv.bind(root[0], state);

   liveapi.cached.send({residence_list: 1})
      .then((data) => {
         state.account.residence_list = data.residence_list.map((r) => {
            r.disabled = (r.disabled === 'DISABLED' || r.disabled === true);
            r.disabled && state.account.residence_unsupported.push(r.value);
            return r;
         });
         state.account.residence = 'id'; // make indonesia default
         liveapi.cached.send({website_status: 1})
            .then((data) => {
               const residence = data.website_status && data.website_status.clients_country;
               if(state.account.residence_unsupported.indexOf(residence) === -1)
                  state.account.residence = residence || 'id';
            })
            .catch((err) => {
               console.error(err);
               state.account.residence = 'id';
            })
      })
      .catch((err) => {
         console.error(err);
         $.growl.error({ message: err.message });
      });
}

export const login = () => {
   const app_id = liveapi.app_id;
   const config = local_storage.get('config');
   const oauth_url = (config && config.oauth_url) || 'https://oauth.binary.com/oauth2/authorize';
   window.location =  oauth_url + '?app_id=' + app_id;
}

export default {
   init,
   login
}
