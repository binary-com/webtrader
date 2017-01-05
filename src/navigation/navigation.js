/* Created by Armin on 10/17/2015 */

define(["jquery", "moment", "lodash", "websockets/binary_websockets", "common/rivetsExtra", "text!navigation/navigation.html", "css!navigation/navigation.css", "common/util"], function ($, moment, _, liveapi, rv, $navHtml) {
    "use strict";

    function updateListItemHandlers() {
        $("#nav-menu .nav-dropdown-toggle").each(function(){
          $(this).unbind("click").on("click",function(){
            var $ul = $(this).next();
            if($ul){
              if($($ul[0]).css("visibility")==="hidden") 
                $($ul[0]).css({visibility:"visible",opacity:1,display:"block"});
              else 
                $($ul[0]).css({visibility:"",opacity:"",display:""});
            } else{
              console.log("ul not found");
            }
          });
        });
        $("#nav-menu li").each(function(){
          $(this).unbind("mouseleave").on("mouseleave",function(){
            var $ul = $(this).find("ul");
            if($ul){
              $($ul[0]).css({visibility:"",opacity:"",display:""});
            }
          });
        });
        
    }

    function initLoginButton(root) {
        var account_menu = root.find('.account-menu');
        var time = root.find('span.time');
        var state = {
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
        state.oauth = state.oauth.map(function(e){
          e.type = getType(e.id);
          return e;
        })
        state.showLoginWin = function () {
            state.login_disabled = true;
            require(['oauth/login'], function (login_win) {
                state.login_disabled = false;
                login_win.init();
            });
        };

        state.toggleVisibility = function(value){
          state.show_submenu = value;
        };

        state.logout = function(){
          liveapi.invalidate();
          state.logout_disabled = true;
        };

        state.switchAccount = function(id){
          liveapi.switch_account(id)
            .catch(function (err) {
                $.growl.error({message: err.message});
                // logout user if he decided to self exclude himself.
                if(err.code==="SelfExclusion"){
                  console.log("logging out because of self exclude");
                  liveapi.invalidate();
                }
            });
        }

        function getType(id){
          if(!id) return;
          var type = {MLT:"Investment", MF:"Gaming",VRTC:"Virtual",REAL:"Real"};
          var id = id.match(/^(MLT|MF|VRTC)/i) ? id.match(/^(MLT|MF|VRTC)/i)[0] : "REAL";
          return type[id]+" Account";
        };

        rv.bind(account_menu, state);

        function update_balance(data) {
            if (!state.currency) {
                liveapi.send({payout_currencies: 1})
                    .then(function (_data) {
                        state.currency = _data.payout_currencies[0];
                        local_storage.set("currency", state.currency);
                        setTimeout(function () {
                            update_balance(data);
                        }, 0);
                        /* now that we have currency update balance */
                    }).catch(function (err) {
                    console.error(err);
                })
                return;
            }

            var value = '0';
            if (data.authorize) value = data.authorize.balance;
            else value = data.balance ? data.balance.balance : '0';

            state.account.balance = formatPrice(value, state.currency);
        };

        /* update balance on change */
        liveapi.events.on('balance', update_balance);

        liveapi.events.on('logout', function () {
            $('.webtrader-dialog[data-authorized=true]').dialog('close').dialog('destroy').remove();
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

        liveapi.events.on('login', function (data) {
            $('.webtrader-dialog[data-authorized=true]').dialog('close').dialog('destroy').remove();
            /* destroy all authorized dialogs */
            console.log(data);
            state.show_login = false;
            state.account.show = true;
            state.account.id = data.authorize.loginid;
            state.account.is_virtual = data.authorize.is_virtual;
            if(!data.authorize.is_virtual){
              var type = {MLT:"Investment", MF:"Gaming",REAL:"Real"};
              var id = data.authorize.loginid.match(/^(MLT|MF)/i) ? data.authorize.loginid.match(/^(MLT|MF)/i)[0] : "REAL";
              state.account.type = type[id]+" Account";
            } else {
              state.account.type = "Virtual Account";
            }

            update_balance(data);
            var is_current_account_real = data.authorize.is_virtual === 0;

            getLandingCompany().then(function(what_todo){
              state.show_financial_link = is_current_account_real && (what_todo === 'upgrade-mf');
              state.show_realaccount_link = !is_current_account_real && (what_todo === 'upgrade-mlt');
              var loginids = Cookies.loginids();
              state.has_real_account = _.some(loginids, {is_real: true});
              state.has_disabled_account =  _.some(loginids, {is_disabled: true});

              if(_.some(loginids, {is_disabled: true})) {
                $.growl.error({
                  fixed: true,
                  message:"<a href='https://www.champion-fx.com/en/contactus' target='_blank'>"
                          + "Your account is locked, please contact customer support for more info.".i18n()
                          + "</a>"
                });
              }
            });
        });

        // Restore login-button in case of login-error
        $('.login').on("login-error",function(e) {
            console.log("Encountered login error");
            state.show_login = true;
        });

        /* update time every one minute */
        time.text(moment.utc().format('YYYY-MM-DD HH:mm') + ' GMT');
        setInterval(function () {
            time.text(moment.utc().format('YYYY-MM-DD HH:mm') + ' GMT');
        }, 15 * 1000);
    }

    function initLangButton(root) {
      root = root.find('#topbar').addBack('#topbar');
      var state = {
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
          { value: 'vi', name: 'Tiếng Việt'},
          { value: 'zh_cn', name: '简体中文'},
          { value: 'zh_tw', name: '繁體中文'},
        ]
      };
      state.onclick = function(value) {
        state.confirm.visible = false;
        var lang = _.find(state.languages, {value: value});
        if(lang.value == state.lang.value)
          return;

        local_storage.set('i18n', {value: lang.value});
        window.location.reload();
      };

      state.toggleVisibility = function(visible){
          state.confirm.visible = visible;
        }

      var value = (local_storage.get('i18n') || {value: 'en'}).value;
      state.lang = _.find(state.languages, {value: value}); // set the initial state.

      rv.bind(root[0], state);

      //Init the trigger of loading language list from server
      liveapi
        .cached
        .send({website_status: 1})
        .then(function(data){
          var supported_languages = (data.website_status || {}).supported_languages || [];
          supported_languages = _.map(supported_languages, function(m) { return {value: m.toLowerCase()} });
          var newList = _.intersectionBy(state.languages, supported_languages, 'value') || [];
          state.languages.length = 0;
          newList.forEach(function(e) {
            state.languages.push(e);
          });
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
    function getLandingCompany() {
       return liveapi
       .cached.send({landing_company: Cookies.residence() })
        .then(function(data) {
             var financial = data.landing_company.financial_company;
             var gaming = data.landing_company.gaming_company;

             var loginids = Cookies.loginids();
             if (gaming && financial && financial.shortcode === 'maltainvest') { // 1:
                 if (_.some(loginids, {is_mlt: true}) && _.some(loginids, {is_mf: true})) // 1-c
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
    }

    return {
        init: function (_callback) {
            var root = $($navHtml).i18n();
            $("body").prepend(root);

            initLoginButton(root);
            initLangButton(root);
            //Theme settings
            require(['themes/themes']);

            updateListItemHandlers();

            if (_callback) {
                _callback($("#nav-menu"));
            }

            //Show config <LI> if its production and not BETA
            if (is_beta()) {
                root.find("a.config").closest('li').show();
            }

        },
        getLandingCompany: getLandingCompany,
        updateDropdownToggles : updateListItemHandlers
    };

});
