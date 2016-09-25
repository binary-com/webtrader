/* Created by Armin on 10/17/2015 */

define(["jquery", "moment", "lodash", "websockets/binary_websockets", "common/rivetsExtra", "text!navigation/navigation.html", "css!navigation/navigation.css", "common/util"], function ($, moment, _, liveapi, rv, $navHtml) {
    "use strict";

    function updateListItemHandlers() {
        $("#nav-menu li > ul li").each(function () {
            var $li = $(this);
            if ($li.hasClass('update-list-item-handlers'))
                return;
            $li.addClass('update-list-item-handlers');
            $li.on("click", function() {
                var $elem = $(this);
                var hasSubMenus = $elem.find("ul").length > 0;
                if (!hasSubMenus) {
                    if(!$elem.parent("ul").hasClass("nav-closed")){
                        $elem.parent("ul").not("#nav-menu").toggleClass("nav-closed");
                    }

                }
            });
        });
        $("#nav-menu.nav-normal-menu li").each(function () {
            $(this).on("mouseover", function () {
                $(this).find("ul.nav-closed").each(function () {
                    $(this).removeClass("nav-closed");
                });
            });
        });
    }

    function initLoginButton(root) {
        var login_menu = root.find('.login');
        var account_menu = root.find('.account').hide();
        var real_accounts_only = account_menu.find('li.visible-on-real-accounts-only').hide();
        var upgrade_account_li = account_menu.find('li.upgrade-account').hide();
        var time = root.find('span.time');
        var login_btn = root.find('.login button');
        var logout_btn = root.find('.account .logout');
        var loginid = root.find('.account span.login-id');
        var balance = root.find('.account span.balance').fadeOut();
        var currency = '';
        /* don't show the login menu if redirecting from oauth */
        local_storage.get('oauth') && login_menu.hide();

        function update_balance(data) {
            if (!currency) {
                liveapi.send({payout_currencies: 1})
                    .then(function (_data) {
                        currency = _data.payout_currencies[0];
                        local_storage.set("currency",currency);
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

            balance.text(formatPrice(value, currency)).fadeIn();
        };

        /* update balance on change */
        liveapi.events.on('balance', update_balance);

        liveapi.events.on('logout', function () {
            $('.webtrader-dialog[data-authorized=true]').dialog('close').dialog('destroy').remove();
            /* destroy all authorized dialogs */
            logout_btn.removeAttr('disabled');
            account_menu.fadeOut();
            login_menu.fadeIn();
            loginid.fadeOut();
            // time.fadeOut();
            balance.fadeOut();
            currency = '';
            local_storage.remove("currency");
        });

        liveapi.events.on('login', function (data) {
            $('.webtrader-dialog[data-authorized=true]').dialog('close').dialog('destroy').remove();
            /* destroy all authorized dialogs */
            login_menu.fadeOut();
            account_menu.fadeIn();

            update_balance(data);
            loginid.text('Account ' + data.authorize.loginid).fadeIn();

            var oauth = local_storage.get('oauth') || [];
            var is_current_account_real = data.authorize.is_virtual === 0;
            is_current_account_real ? real_accounts_only.show() : real_accounts_only.hide();

            getLandingCompany().then(function(what_todo){
              var show_financial_link = is_current_account_real && (what_todo === 'upgrade-mf');
              var show_realaccount_link = !is_current_account_real && (what_todo === 'upgrade-mlt');
              var loginids = Cookies.loginids();
              var has_real_account = _.some(loginids, {is_real: true});
              var has_disabled_account =  _.some(loginids, {is_disabled: true});

              if(_.some(loginids, {is_disabled: true})) {
                $.growl.error({
                  fixed: true,
                  message:"<a href='https://www.binary.com/en/contact.html' target='_blank'>"
                          + "Your account is locked, please contact customer support for more info.".i18n()
                          + "</a>"
                });
              }

              var toggle = function(show, el) { show ? el.show() : el.hide(); }
              toggle(!show_financial_link, upgrade_account_li.find('.upgrade-to-real-account-span'));
              toggle(show_financial_link, upgrade_account_li.find('.open-financial-account-span'));
              toggle(show_realaccount_link || show_financial_link, upgrade_account_li);
              toggle(show_realaccount_link || show_financial_link, upgrade_account_li.find('a.real-account'));
            });

            /* switch between account on user click */
            $('.account li.info').remove();
            oauth.forEach(function (account) {
                if (account.id !== data.authorize.loginid) {
                    var a = $('<a href="#"></a>').html('<span class="ui-icon ui-icon-login"></span>' + account.id);
                    var li = $('<li/>').append(a).addClass('info');
                    li.data(account);
                    li.click(function () {
                        var data = $(this).data();
                        $('.account li.info').remove();
                        liveapi.switch_account(data.id)
                            .catch(function (err) {
                                $.growl.error({message: err.message});
                            })
                    })
                    li.insertBefore(logout_btn.parent());
                }
            });
        });

        login_btn.on('click', function () {
            login_btn.attr('disabled', 'disabled');
            require(['oauth/login'], function (login_win) {
                login_btn.removeAttr('disabled');
                login_win.init();
            });
        });
        logout_btn.on('click', function () {
            liveapi.invalidate();
            logout_btn.attr('disabled', 'disabled');
        });

        // Restore login-button in case of login-error
        $('.login').on("login-error",function(e) {
            console.log("Encountered login error");
            login_menu.fadeIn();
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
            { value: 'id', name: 'Bahasa Indonesia'},
            { value: 'it', name: 'Italiano'},
            { value: 'pl', name: 'Polish'},
            { value: 'pt', name: 'Português'},
            { value: 'ru', name: 'Русский'},
            { value: 'vi', name: 'Vietnamese'},
            { value: 'zh_cn', name: '简体中文'},
            { value: 'zh_tw', name: '繁體中文'},
        ]
      };
      state.onclick = function(value) {
        var lang = _.find(state.languages, {value: value});
        if(lang.value == state.lang.value)
          return;

        local_storage.set('i18n', {value: lang.value});
        window.location.reload();
      };

      var value = (local_storage.get('i18n') || {value: 'en'}).value;
      state.lang = _.find(state.languages, {value: value}); // set the initial state.

      rv.bind(root[0], state);
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
