import $         from 'jquery';
import moment    from 'moment';
import _         from 'lodash';
import liveapi   from '../websockets/binary_websockets';
import rv        from '../common/rivetsExtra';
import $navHtml  from 'text!./navigation.html';
import workspace from '../workspace/workspace.js';
import '../common/util';
import 'css!navigation/navigation.css';

const menu_selectors = [
   '.trade',
   '.instruments',
   '.resources',
   '.workspace'
];

const getType = (acc) => {
   let id = acc.loginid || acc.id;
   if(!acc || !id) return;
   const type = {
         MLT:'Gaming', 
         MF:'Investment',
         VRTC:'Demo',
         REAL:(acc.currency || '').toUpperCase() || 'Real',
   };

   id = id.match(/^(MLT|MF|VRTC)/i) ? id.match(/^(MLT|MF|VRTC)/i)[0] : 'REAL';

   return type[id] + ' Account';
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
         show: false,
         type: '',
         id: '',
         balance: '',
         is_virtual: 0,
      },
      show_submenu: false,
      show_new_account_link: false,
      openRealAccount: () => {
         const real_account_binary_url = getBinaryUrl('new_account/realws.html');
         window.open(real_account_binary_url, '_blank');
      },
      openFinancialAccountMF: () => {
         const financial_account_binary_url = getBinaryUrl('new_account/maltainvestws');
         window.open(financial_account_binary_url, '_blank');
      }
   };

   const destroy_windows = (data_attribute) => {
      $(`.webtrader-dialog[${data_attribute}]`).each((inx, elm) => {
         const dlg = $(elm);
         dlg.dialog('close');
         dlg.one('dialogclose', () => {
            _.defer(() => dlg.dialog('instance') && dlg.dialog('destroy') && dlg.remove());
         });
      });
   }

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
      destroy_windows('data-account-specific=true');
      liveapi.switch_account(id)
         .catch((err) => {
            $.growl.error({ message: err.message });
            // logout user if he decided to self exclude himself.
            if (err.code === 'SelfExclusion') {
               liveapi.invalidate();
            }
         });
   }

   rv.bind(account_menu, state);

   const update_balance = (data) => {
      if (!state.currency) {
         /* We're not going to set currency automatically, since the user might select a different currency  */
         if (local_storage.get('currency')){
            state.currency = local_storage.get('currency');
         } else 
         return;
      }

      let value = '0';
      if (data.authorize) value = data.authorize.balance;
      else if (data.balance) value =  data.balance.balance ;
      else return;

      state.account.balance = formatPrice(value, state.currency);
   };

   /* update balance on change */
   liveapi.events.on('balance', data => {
      if (local_storage.get("authorize")) {
         const loginId = local_storage.get('authorize').loginid;
         if (data.balance && data.balance.loginid === loginId) update_balance(data);
      }
   });

   liveapi.events.on('logout', () => {
      destroy_windows('data-authorized=true');
      destroy_windows('data-account-specific=true');
      /* destroy all authorized dialogs */
      state.logout_disabled = false;
      state.account.show = false;
      state.show_login = true;
      state.account.id = '';
      state.account.balance = '';
      state.account.type = '';
      state.currency = '';

      local_storage.remove('currency');
   });

   liveapi.events.on('login', (data) => {
      destroy_windows('data-authorized=true');
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
      local_storage.set('currency', state.currency);
      if (local_storage.get('authorize')) {
         const loginId = local_storage.get('authorize').loginid;
         if (data.authorize && data.authorize.loginid === loginId) update_balance(data);
      }

      const is_current_account_real = data.authorize.is_virtual === 0;

      getLandingCompany().then((what_todo) => {
         state.show_financial_link = (what_todo === 'upgrade-mf');
         state.show_realaccount_link = (what_todo === 'upgrade-mlt');
         const loginIds = loginids();
         state.has_real_account = _.some(loginIds, { is_real: true });
         state.has_mf_or_mlt = _.some(loginIds, { is_mf: true }) || _.some(loginIds, { is_mlt: true });
         state.show_new_account_link = what_todo === 'new-account';
         state.has_disabled_account =  _.some(loginIds, { is_disabled: true });
         // https://trello.com/c/9PCHncnx/5146-8-raunak-accountlistordering
         // https://trello.com/c/fNZ1Zkbb/2529-negar-accountlistauthorize
         if(_.some(oAuthLoginIds(), { is_disabled: true })) {
            const lockedIds = _.filter(loginIds, { s_disabled:true }).map(acc => acc.id).join(',');
            $.growl.error({
               fixed: true,
               message:`<a href='${getBinaryUrl('contact.html')}' target='_blank'>
                ${'Your account (%) is locked, please contact customer support for more info.'.i18n().replace('%', lockedIds)}
               </a>`
            });
         }
      });
   });

   // Restore login-button in case of login-error
   $('.login').on('login-error', (e) => {
      console.log('Encountered login error');
      state.show_login = true;
   });

   /* update time every second */
   time.text(moment.utc().format('YYYY-MM-DD HH:mm:ss') + ' GMT');
   setInterval(() => {
      time.text(moment.utc().format('YYYY-MM-DD HH:mm:ss') + ' GMT');
   }, 1000);
}

const initLang = (root) => {
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
         { value: 'de', name: 'Deutsch'},
         { value: 'es', name: 'Español'},
         { value: 'fr', name: 'Français'},
         // { value: 'id', name: 'Indonesia'},
         { value: 'it', name: 'Italiano'},
         { value: 'pl', name: 'Polish'},
         { value: 'pt', name: 'Português'},
         { value: 'ru', name: 'Русский'},
         { value: 'th', name: 'Thai'},
         { value: 'vi', name: 'Tiếng Việt'},
         { value: 'zh_cn', name: '简体中文'},
         { value: 'zh_tw', name: '繁體中文'}
      ],
   };

   state.onclick = (value) => {
      state.confirm.visible = false;
      const lang = _.find(state.languages, { value: value });
      if(lang && state.lang && lang.value == state.lang.value)
         return;

      local_storage.set('i18n', { value: lang.value });
      window.location.reload();
   };

   state.toggleVisibility = (visible) => {
      state.confirm.visible = visible;
   }

   const lang = (local_storage.get('i18n') || { value: 'en' }).value;
   state.lang = _.find(state.languages, { value: lang }); // set the initial state.

   const contact_us_el = document.getElementById('contact-us');
   const logo_container = document.getElementById('logo-container');

   contact_us_el.href = getBinaryUrl('contact.html');
   logo_container.href = getBinaryUrl('home.html');

   rv.bind(root[0], state);

   //Init the trigger of loading language list from server
   liveapi
      .cached
      .send({website_status: 1})
      .then((data) => {
         let supported_languages = (data.website_status || {}).supported_languages || [];
         supported_languages = _.map(supported_languages, (m) => ({ value: m.toLowerCase() }));
         const newList = _.intersectionBy(state.languages, supported_languages, 'value') || [];
         state.languages.length = 0;
         newList.forEach(
            (e) => state.languages.push(e)
         );
      })
      .catch(console.error);
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
  5: shortcode = svg
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
            liveapi.cached.send({ landing_company: data.authorize.country }),
            liveapi.cached.send({ landing_company_details: data.authorize.landing_company_name })
         ])
         .then((results) => {
            const data = results[0];
            const landing_company_details = data.landing_company.virtual_company === 'virtual' ?
              data.landing_company.financial_company || {} :
              results[1].landing_company_details || {};
            const financial = data.landing_company.financial_company;
            const gaming = data.landing_company.gaming_company;
            const loginIds = loginids();
            const curr_login = local_storage.get('oauth')[0];
            curr_login.is_mlt = /MLT/.test(curr_login.id);
            if (gaming && financial && financial.shortcode === 'maltainvest') { // 1:
               if (_.some(loginIds, { is_mlt: true }) && (_.some(loginIds, { is_mf: true }) || !curr_login.is_mlt)) // 1-c
                  return 'do-nothing';
               if (_.some(loginIds, { is_mlt: true })) // 1-b
                  return 'upgrade-mf';
               return 'upgrade-mlt'; // 1-a
            }
            if (financial && financial.shortcode === 'maltainvest' && !gaming) { // 2:
               if (_.some(loginIds, { is_mf: true })) // 2-b
                  return 'do-nothing';
               return 'upgrade-mf'; // 2-a
            }
            // 3:
            if (_.some(loginIds, { is_mlt: true }) || _.some(loginIds, { is_mx: true }))
               return 'do-nothing'; // 3-b
            // 4: never happens, japan accounts are not able to log into webtrader.
            // 5:
            const cr_accts = _.filter(loginIds, { is_cr: true });
            if( cr_accts.length && landing_company_details.legal_allowed_currencies) {
               const currencies_config = local_storage.get('currencies_config') || {};
               const has_fiat = _.some(cr_accts, { type: 'fiat' });
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
         })
         .catch((err) => {
            $.growl.error({ message: err.message });
         });;
   })
   .catch((err) => {
      $.growl.error({ message: err.message });
   });
}

export const init = (callback) => {
   const root = $($navHtml).i18n();
   $('body').prepend(root);

   initLoginButton(root);
   initLang(root);

   //Load theme settings ...
   require(['themes/themes']);

   $('#nav-menu .resources > ul').menu();
   workspace.init($('#nav-menu .workspace'));

   if (callback) {
      callback($('#nav-menu'));
   }

   //Show config <LI> if its production and not BETA
   if (is_beta()) {
      root.find('a.config').closest('li').show();
   }

   // Handle click navigation to show menu dialog
   menu_selectors.forEach((selector) => {
      const nav_selector = 'nav #nav-menu';
      const dialog_selector = `${nav_selector} ${selector} > ul`;
      const current_selector = `${nav_selector} ${selector}`;
      const visible = {
         'visibility': 'visible',
         'opacity': 1,
      };
      $(current_selector).click((e) => {
            $(dialog_selector).fadeToggle('fast',
            () => {
               $(dialog_selector).css(visible);
            }
         );
      });
      $(document).mouseup((e) => {
         if (!$(current_selector).is(e.target) && $(current_selector).has(e.target).length === 0) {
            $(dialog_selector).hide();
         }
      });
   });
}

export default {
   init,
   getLandingCompany
};
