/* Created by Armin on 10/17/2015 */

import $ from 'jquery';
import moment from 'moment';
import _ from 'lodash';
import liveapi from '../websockets/binary_websockets';
import rv from '../common/rivetsExtra';
import $navHtml from 'text!./navigation.html';
import '../common/util';
import 'css!navigation/navigation.css';

export const updateDropdownToggles = () => {
   $("#nav-menu .nav-dropdown-toggle").each(function(){
      $(this).unbind("click").on("click",function(){
         const $ul = $(this).next();
         if($ul){
            if($($ul[0]).css("visibility")==="hidden") 
               $($ul[0]).css({visibility:"visible",opacity:1,display:"block"});
            else 
               $($ul[0]).css({visibility:"",opacity:"",display:""});
         }
      });
   });
   $("#nav-menu li").each(function(){
      const class_name = $(this).attr("class") && $(this).attr("class").split(" ")[0];
      if(class_name=== "account" || class_name === "login")
         return;
      $(this).unbind("click").on("click", function(){
         if($(this)[0].lastChild.nodeName === "A"){
            $(this).trigger("mouseleave");
         }
      });
      $(this).unbind("mouseleave").on("mouseleave",function(){
         const $ul = $(this).find("ul");
         if($ul){
            $($ul[0]).css({visibility:"",opacity:"",display:""});
         }
      });
   });

}

const getType = (id) => {
   if(!id) return;
   const type = {MLT:"Gaming", MF:"Investment",VRTC:"Virtual",REAL:"Real"};
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
   };


   state.oauth = local_storage.get('oauth') || [];
   state.oauth = state.oauth.map((e) => {
      e.type = getType(e.id);
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
         e.type = getType(e.id);
         return e;
      });
      state.account.type = getType(data.authorize.loginid);

      state.currency = data.authorize.currency;
      local_storage.set("currency", state.currency);
      update_balance(data);
      const is_current_account_real = data.authorize.is_virtual === 0;

      getLandingCompany().then((what_todo) => {
         state.show_financial_link = (what_todo === 'upgrade-mf');
         state.show_realaccount_link = (what_todo === 'upgrade-mlt');
         const loginids = Cookies.loginids();
         state.has_real_account = _.some(loginids, {is_real: true});
         state.has_disabled_account =  _.some(loginids, {is_disabled: true});

         if(_.some(loginids, {is_disabled: true})) {
            $.growl.error({
               fixed: true,
               message:"<a href='https://www.binary.com/en/contact.html' target='_blank'>"
               + "Your account is locked, please contact customer support for more info.".i18n()
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

   /* update time every one minute */
   time.text(moment.utc().format('YYYY-MM-DD HH:mm') + ' GMT');
   setInterval(() => {
      time.text(moment.utc().format('YYYY-MM-DD HH:mm') + ' GMT');
   }, 15 * 1000);
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
     b: has MLT, MX, CR account ==> do nothing
  4: company shortcode == japan
     a: do nothing and show an error message

  returns 'upgrade-mlt' | 'upgrade-mf' | 'do-nothing'
*/
export const getLandingCompany = () => {
   return liveapi.cached.authorize().then((data) => {
      return liveapi
         .cached.send({landing_company: data.authorize.country })
         .then((data) => {
            const financial = data.landing_company.financial_company;
            const gaming = data.landing_company.gaming_company;

            const loginids = Cookies.loginids();
            const curr_login = local_storage.get("oauth")[0];
            curr_login.is_mlt = /MLT/.test(curr_login.id);
            if (gaming && financial && financial.shortcode === 'maltainvest') { // 1:
               if (_.some(loginids, {is_mlt: true}) && (_.some(loginids, {is_mf: true}) || !curr_login.is_mlt)) // 1-c
                  return 'do-nothing';
               if (_.some(loginids, {is_mlt: true})) // 1-b
                  return 'upgrade-mf';
               return 'upgrade-mlt'; // 1-a
            }
            if (financial && financial.shortcode === 'maltainvest' && !gaming) { // 2:
               if (_.some(loginids, {is_mf: true})) // 2-b
                  return 'do-nothing';
               return 'upgrade-mf'; // 2-a
            }
            // 3:
            if (_.some(loginids, {is_mlt: true}) || _.some(loginids, {is_mx: true}) || _.some(loginids, {is_cr: true}))
               return 'do-nothing'; // 3-b
            return 'upgrade-mlt'; // 3-a (calls the normal account opening api which creates an mlt, mx or cr account).
            // 4: never happens, japan accounts are not able to log into webtrader.
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

   updateDropdownToggles();

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
   getLandingCompany,
   updateDropdownToggles
};

