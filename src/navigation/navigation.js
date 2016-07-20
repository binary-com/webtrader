/* Created by Armin on 10/17/2015 */

define(["jquery", "moment", "lodash", "common/rivetsExtra", "text!navigation/navigation.html", "css!navigation/navigation.css", "common/util"], function ($, moment, _, rv, $navHtml) {
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
        var real_account_opening = account_menu.find('li.real-account-li').hide();
        var time = root.find('span.time');
        var login_btn = root.find('.login button');
        var logout_btn = root.find('.account .logout');
        var loginid = root.find('.account span.login-id');
        var balance = root.find('.account span.balance').fadeOut();
        var currency = '';
        /* don't show the login menu if redirecting from oauth */
        local_storage.get('oauth') && login_menu.hide();

        /* will get this from payout_currencies api on login */
        require(['websockets/binary_websockets'], function (liveapi) {

            function update_balance(data) {
                if (!currency) {
                    liveapi.send({payout_currencies: 1})
                        .then(function (_data) {
                            currency = _data.payout_currencies[0];
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
                else value = data.balance.balance;

                balance.text(currency + ' ' + formatPrice(value)).fadeIn();
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
            });

            liveapi.events.on('login', function (data) {
                $('.webtrader-dialog[data-authorized=true]').dialog('close').dialog('destroy').remove();
                /* destroy all authorized dialogs */
                login_menu.fadeOut();
                account_menu.fadeIn();

                update_balance(data);
                loginid.text('Account ' + data.authorize.loginid).fadeIn();

                var oauth = local_storage.get('oauth') || [];
                var is_real = false;
                for(var i = 0; i < oauth.length; ++i) {
                  if(oauth[i].is_virtual === 0)
                    is_real = true;
                }
                is_real ? real_account_opening.hide() : real_account_opening.show();

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
            $('.login').on("login-error",function(e){
                console.log("Encountered login error");
                login_menu.fadeIn();
            });
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
        perv_lang: null,
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
        state.perv_lang = state.lang;
        state.lang = lang;
        state.confirm.visible = true;
      };
      state.confirm.no = function() {
        state.lang = state.perv_lang;
        state.confirm.visible = false;
      }
      state.confirm.yes = function() {
        local_storage.set('i18n', {value: state.lang.value});
        window.location.reload();
        state.confirm.visible = false;
      }

      var value = (local_storage.get('i18n') || {value: 'en'}).value;
      state.lang = _.find(state.languages, {value: value}); // set the initial state.

      rv.bind(root[0], state);
    }

    return {
        init: function (_callback) {
            var root = $($navHtml);
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
        updateDropdownToggles : updateListItemHandlers
    };

});
