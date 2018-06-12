/* Created by Armin on 10/17/2015 */

import $ from 'jquery';
import moment from 'moment';
import _ from 'lodash';
import liveapi from '../websockets/binary_websockets';
import rv from '../common/rivetsExtra';
import $navHtml from 'text!./navigation.html';
import workspace from '../workspace/workspace.js';
import '../common/util';
import 'css!navigation/navigation.css';

const getType = (acc) => {
   let id = acc.loginid || acc.id;
   if(!acc || !id) return;
   const type = {
         MLT:"Gaming", 
         MF:"Investment",
         VRTC:"Virtual",
         REAL:(acc.currency || '').toUpperCase() || 'Real'
   };
   id = id.match(/^(MLT|MF|VRTC)/i) ? id.match(/^(MLT|MF|VRTC)/i)[0] : "REAL";
   return type[id]+" Account";
};


const initLoginButton = (root) => {
   const account_menu = root.find('.account-menu');
   const time = root.find('span.time');
   const state = {
      show_login: local_storage.get('oauth') ? false : true,
      login_disabled: false,
      currency: '',
      logout_disabled: false,
      account: {
         show:false,
         type:'',
         id:'',
         balance: '',
         is_virtual:0
      },
      show_submenu: false,
      show_new_account_link: false,

   };


   state.oauth = local_storage.get('oauth') || [];
   state.oauth = state.oauth.map((e) => {
      e.type = getType(e);
      return e;
   });
   state.showLoginWin = () => {
      state.login_disabled = true;
      require(['oauth/login'], (login_win) => {
         state.login_disabled = false;
         login_win.init();
      });
   };

   state.toggleVisibility = (value) => {
      state.show_submenu = value;
   };

   state.logout = () => {
      liveapi.invalidate();
      state.logout_disabled = true;
   };

   state.switchAccount = (id) => {
      liveapi.switch_account(id)
         .catch((err) => {
            $.growl.error({message: err.message});
            // logout user if he decided to self exclude himself.
            if(err.code==="SelfExclusion"){
               console.log("logging out because of self exclude");
               liveapi.invalidate();
            }
         });
   }

   rv.bind(account_menu, state);

   const update_balance = (data) => {
      if (!state.currency) {
         /* We're not going to set currency automatically, since the user might select a different currency  */
         if (local_storage.get("currency")){
            state.currency = local_storage.get("currency");
          } else 
            return;
      }

      let value = '0';
      if (data.authorize) value = data.authorize.balance;
      else value = data.balance ? data.balance.balance : '0';

      state.account.balance = formatPrice(value, state.currency);
   };

   /* update balance on change */
   liveapi.events.on('balance', update_balance);

   liveapi.events.on('logout', () => {
      $('.webtrader-dialog[data-authorized=true]').each((inx, elm) => {
         const dlg = $(elm);
         dlg.dialog('close');
         dlg.one('dialogclose', () => {
            _.defer(() => dlg.dialog('instance') && dlg.dialog('destroy') && dlg.remove());
         });
      });
      /* destroy all authorized dialogs */
      state.logout_disabled = false;
      state.account.show = false;
      state.show_login = true;
      state.account.id = '';
      state.account.balance = '';
      state.account.type = '';
      state.currency = '';

      local_storage.remove("currency");
   });

   liveapi.events.on('login', (data) => {
      $('.webtrader-dialog[data-authorized=true]').each((inx, elm) => {
         const dlg = $(elm);
         dlg.dialog('close');
         dlg.one('dialogclose', () => {
            _.defer(() => dlg.dialog('instance') && dlg.dialog('destroy') && dlg.remove());
         });
      });
      /* destroy all authorized dialogs */
      state.show_login = false;
      state.account.show = true;
      state.account.id = data.authorize.loginid;
      state.account.is_virtual = data.authorize.is_virtual;
      state.oauth = local_storage.get('oauth') || [];
      state.oauth = state.oauth.map((e) => {
         e.type = getType(e);
         return e;
      });
      state.account.type = getType(data.authorize);

      state.currency = data.authorize.currency;
      local_storage.set("currency", state.currency);
      update_balance(data);
      const is_current_account_real = data.authorize.is_virtual === 0;

      getLandingCompany().then((what_todo) => {
         state.show_financial_link = (what_todo === 'upgrade-mf');
         state.show_realaccount_link = (what_todo === 'upgrade-mlt');
         const loginIds = loginids();
         state.has_real_account = _.some(loginIds, {is_real: true});
         state.has_mf_or_mlt = _.some(loginIds, {is_mf: true}) || _.some(loginIds, {is_mlt: true});
         state.show_new_account_link = what_todo === 'new-account';
         state.has_disabled_account =  _.some(loginIds, {is_disabled: true});

         // https://trello.com/c/9PCHncnx/5146-8-raunak-accountlistordering
         // https://trello.com/c/fNZ1Zkbb/2529-negar-accountlistauthorize
         if(_.some(oAuthLoginIds(), {is_disabled: true})) {
            const lockedIds = _.filter(loginIds, {is_disabled:true}).map(acc => acc.id).join(',');
            $.growl.error({
               fixed: true,
               message:"<a href='https://www.binary.com/en/contact.html' target='_blank'>"
               + "Your account (%) is locked, please contact customer support for more info.".i18n().replace('%', lockedIds)
               + "</a>"
            });
         }
      });
   });

   // Restore login-button in case of login-error
   $('.login').on("login-error", (e) => {
      console.log("Encountered login error");
      state.show_login = true;
   });

   /* update time every second */
   time.text(moment.utc().format('YYYY-MM-DD HH:mm:ss') + ' GMT');
   setInterval(() => {
      time.text(moment.utc().format('YYYY-MM-DD HH:mm:ss') + ' GMT');
   }, 1000);
}

const initLangButton = (root) => {
   root = root.find('#topbar').addBack('#topbar');
   const state = {
      lang: {
         value: 'en', name: 'English'
      },
      confirm: {
         visible: false
      },
      languages: [
         { value: 'en', name: 'English'},
         { value: 'ar', name: 'Arabic'},
         { value: 'de', name: 'Deutsch'},
         { value: 'es', name: 'Español'},
         { value: 'fr', name: 'Français'},
         { value: 'id', name: 'Indonesia'},
         { value: 'it', name: 'Italiano'},
         { value: 'pl', name: 'Polish'},
         { value: 'pt', name: 'Português'},
         { value: 'ru', name: 'Русский'},
         { value: 'th', name: 'Thai'},
         { value: 'vi', name: 'Tiếng Việt'},
         { value: 'zh_cn', name: '简体中文'},
         { value: 'zh_tw', name: '繁體中文'}
      ]
   };

   state.onclick = (value) => {
      state.confirm.visible = false;
      const lang = _.find(state.languages, {value: value});
      if(lang && state.lang && lang.value == state.lang.value)
         return;

      local_storage.set('i18n', {value: lang.value});
      window.location.reload();
   };

   // Open contact us page.
   state.openContactUs = () => {
      const url = 'https://www.binary.com/' + (local_storage.get('i18n') || { value: 'en' }).value + '/contact.html'
      const win = window.open(url, '_blank');
      win.focus();
   }

   state.toggleVisibility = (visible) => {
      state.confirm.visible = visible;
   }

   const value = (local_storage.get('i18n') || {value: 'en'}).value;
   state.lang = _.find(state.languages, {value: value}); // set the initial state.

   rv.bind(root[0], state);

   //Init the trigger of loading language list from server
   liveapi
      .cached
      .send({website_status: 1})
      .then((data) => {
         let supported_languages = (data.website_status || {}).supported_languages || [];
         supported_languages = _.map(supported_languages, (m) => ({value: m.toLowerCase()}));
         const newList = _.intersectionBy(state.languages, supported_languages, 'value') || [];
         state.languages.length = 0;
         newList.forEach(
            (e) => state.languages.push(e)
         );
      })
      .catch(console.error)

}

/*
  1: company = (gaming company) && (financial company && financial company shortcode = maltainvest)
     a: no MLT account  ==> upgrade to MLT
     b: has MLT account
        I:     upgrade to MF
    c: has both MLT & MF ==> do nothing
  2: company = financial company &&  financial company shortcode = maltainvest) && there is NO gaming company
     a: no MF account
        I: company = financial ==> upgrade to MF
     b: has MF account => do nothing
  3: company & shortcode anything except above
     a: no MLT, MX, CR account ==> upgrade to MLT, MX or CR
     b: has MLT, MX ==> do nothing
  4: company shortcode == japan
     a: do nothing and show an error message
  5: shortcode = costarica
     a: No currency
       I: Do nothing.
     b: Fiat currency && Not all crypto currency account
       I: Allow crypto account
     c: Crypto currency account && No fiat currency account
      I: Allow fiat account
     d: Fiat && all crypto account
      I: do nothing.
  returns 'upgrade-mlt' | 'upgrade-mf' | 'do-nothing' | 'new_account'
*/
export const getLandingCompany = () => {
   return liveapi.cached.authorize().then((data) => {
      return Promise.all([
            liveapi.cached.send({landing_company: data.authorize.country }),
            liveapi.cached.send({landing_company_details: data.authorize.landing_company_name})
         ])
         .then((results) => {
            const data = results[0];
            const landing_company_details = data.landing_company.virtual_company === 'virtual' ?
              data.landing_company.financial_company || {} :
              results[1].landing_company_details || {};
            const financial = data.landing_company.financial_company;
            const gaming = data.landing_company.gaming_company;
            const loginIds = loginids();
            const curr_login = local_storage.get("oauth")[0];
            curr_login.is_mlt = /MLT/.test(curr_login.id);
            if (gaming && financial && financial.shortcode === 'maltainvest') { // 1:
               if (_.some(loginIds, {is_mlt: true}) && (_.some(loginIds, {is_mf: true}) || !curr_login.is_mlt)) // 1-c
                  return 'do-nothing';
               if (_.some(loginIds, {is_mlt: true})) // 1-b
                  return 'upgrade-mf';
               return 'upgrade-mlt'; // 1-a
            }
            if (financial && financial.shortcode === 'maltainvest' && !gaming) { // 2:
               if (_.some(loginIds, {is_mf: true})) // 2-b
                  return 'do-nothing';
               return 'upgrade-mf'; // 2-a
            }
            // 3:
            if (_.some(loginIds, {is_mlt: true}) || _.some(loginIds, {is_mx: true}))
               return 'do-nothing'; // 3-b
            // 4: never happens, japan accounts are not able to log into webtrader.
            // 5:
            const cr_accts = _.filter(loginIds, {is_cr: true});
            if( cr_accts.length && landing_company_details.legal_allowed_currencies) {
               const currencies_config = local_storage.get("currencies_config") || {};
               const has_fiat = _.some(cr_accts, {type: 'fiat'});
               const crypto_currencies = _.difference(
                  landing_company_details.legal_allowed_currencies.filter((curr) => {
                     return currencies_config[curr].type === 'crypto';
                  }),
                  _.filter(cr_accts, {type: 'crypto'}).map((acct) => acct.currency)
               );
               const has_crypto = crypto_currencies.length && crypto_currencies.length !== (landing_company_details.legal_allowed_currencies.filter((curr) => {
                  return currencies_config[curr].type === 'crypto';
               }) || []).length;
               const has_all_crypto = !crypto_currencies.length;
               if((!has_fiat && has_crypto) || (has_fiat && !has_all_crypto)) {
                  return 'new-account'; // 5-b and 5-c
               }
               return 'do-nothing'; // 5-d
            }
            return 'upgrade-mlt'; // 3-a (calls the normal account opening api which creates an mlt, mx or cr account).
         });
   });
}

export const init = (callback) => {
   const root = $($navHtml).i18n();
   $("body").prepend(root);

   initLoginButton(root);
   initLangButton(root);

   //Load theme settings ...
   require(['themes/themes']);

   $('#nav-menu .resources > ul').menu();
   workspace.init($('#nav-menu .workspace'));

   if (callback) {
      callback($("#nav-menu"));
   }

   //Show config <LI> if its production and not BETA
   if (is_beta()) {
      root.find("a.config").closest('li').show();
   }
}

export default {
   init,
   getLandingCompany
};

