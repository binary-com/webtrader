/*
 * Created by amin on May 1, 2016.
 */

define(['websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'lodash'], function(liveapi, windows, rv, _) {
    var login_win = null;
    var login_win_view = null; // rivets view

    function init() {
      if(login_win){
        login_win.moveToTop();
        return;
      }

      require(['text!oauth/login.html', 'css!oauth/login.css'], function(root) {
        root = $(root).i18n();
        login_win = windows.createBlankWindow(root, {
            title: 'Log in',
            resizable:false,
            collapsable:false,
            minimizable: false,
            maximizable: false,
            width: 548,
            height: 180,
            'data-authorized': true,
            close: function () {
              login_win.dialog('destroy');
              login_win.remove();
              login_win = null;
            },
            open: function () { },
            destroy: function() {
              login_win_view && login_win_view.unbind();
              login_win_view = null;
            }
        });
        login_win.parent().css('overflow', 'visible');

        init_state(root);
        login_win.dialog('open');

        /* update dialog position, this way when dialog is resized it will not move*/
        var offset = login_win.dialog('widget').offset();
        offset.top = 120;
        login_win.dialog("option", "position", { my: offset.left, at: offset.top });
        login_win.dialog('widget').css({
            left: offset.left + 'px',
            top: offset.top + 'px'
        });
        login_win.dialog('widget').find('.ui-selectmenu-menu ul').css('max-height', '320px');
      });
    }

    function init_state(root) {
      var app_id = liveapi.app_id;
      var state = {
        route: { value: 'login' },
        login: { disabled: false },
        registration: {
          email: '',
          disabled: false,
          validate: { value: false },
          email_show_explanation: function() {
            var email = state.registration.email;
            return (email === '' && !state.registration.validate.value) || validateEmail(email);
          },
        },
        account: {
          empty_fields: {
            validate: false,
            clear: _.debounce(function() {
              state.account.empty_fields.validate = false;
            }, 2000),
            show: function() {
              state.account.empty_fields.validate = true;
              state.account.empty_fields.clear();
            }
          },
          password_error_message: function() {
            var password = state.account.password;
            if(password === '') return state.account.empty_fields.validate ? '* Please enter your password'.i18n() : '';
            if(password.length < 6) return '* Password must be 6 characters minimum'.i18n();
            if(!/\d/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password)) return '* Password must contain lower and uppercase letters with numbers'.i18n();
            return '';
          },
          verification: '',
          password: '',
          repeat_password:  '',
          residence: 'af',
          residence_list: [ { text: 'Afghanistan', value: 'af'}],
          residence_unsupported: ["cr", "gg", "hk", "ir", "iq", "jp", "je", "kp", "my", "mt", "us", "um", "vi"],
          disabled: false, /* is button disabled */
        },
        confirm: { disabled: false }
      };

      state.login.login = function() {
          state.login.disabled = true;
          var config = local_storage.get('config');
          var oauth_url = (config && config.oauth_url) || 'https://oauth.binary.com/oauth2/authorize';
          window.location =  oauth_url + '?app_id=' + app_id + '&scope=read,trade,payments,admin';
      }

      state.confirm.confirm = function() {
          state.confirm.disabled = true;
          var config = local_storage.get('config');
          var oauth_url = (config && config.oauth_url) || 'https://oauth.binary.com/oauth2/authorize';
          window.location =  oauth_url + '?app_id=' + app_id + '&scope=read,trade,payments,admin';
      }

      state.route.update = function(route){
        var routes = {
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
        var title = routes[route].title;
        var height = routes[route].height;
        login_win.dialog('option', 'title', title);
        login_win.dialog('option', 'height', height);
      };

      state.registration.validate.clear = _.debounce(function(){
        state.registration.validate.value = false;
      }, 2000);

      state.registration.validate.show = function() {
        state.registration.validate.value = true;
        state.registration.validate.clear();
      }

      /* { verify_email: 'email' } step */
      state.registration.create = function() {
        var email = state.registration.email;
        if(email == '' || !validateEmail(email)) {
          state.registration.validate.show();
          return;
        }

        state.registration.disabled = true;
        liveapi.send({verify_email: email, type: 'account_opening'})
                .then(function(data) {
                  state.registration.disabled = false;
                  if(data.verify_email) {
                    $.growl.notice({ message: 'Verification code sent to '.i18n() + email });
                    state.route.update('account');
                  }
                  else  {
                    throw { message: 'Email verification failed ('.i18n() + data.msg_type + ')' };
                  }
                })
                .catch(function(err) {
                  console.error(err);
                  $.growl.error({ message: err.message });
                  state.registration.disabled = false;
                });
      }

      /* { new_account_virtual: 1 } step */
      state.account.open = function() {
        state.account.empty_fields.show();
        var email = state.registration.email,
            verification = state.account.verification,
            password = state.account.password,
            repeat_password = state.account.repeat_password,
            residence = state.account.residence;
        var ok = validateEmail(email) && verification !== '' && password === repeat_password && password.length >= 6;
        ok = ok && /\d/.test(password) && /[a-z]/.test(password) && /[A-Z]/.test(password)  && residence.length === 2;

        if(!ok) { return; }

        var request = {
          new_account_virtual: 1,
          verification_code: verification,
          client_password: password,
          residence: residence,
          // affilate_token: '???'
        };
        state.account.disabled = true;
        liveapi.send(request)
               .then(function(data) {
                  var account = data.new_account_virtual;
                  var oauth = [{id: account.client_id, token: account.oauth_token }];
                  local_storage.set('oauth', oauth);
                  //liveapi.cached.authorize().catch(function(err) { console.error(err.message) });
                  state.account.disabled = false;
                  state.route.update('confirm');
               })
               .catch(function(err){
                  console.error(err);
                  $.growl.error({ message: err.message });
                  state.account.disabled = false;
               });
      }

      login_win_view = rv.bind(root[0], state);

      liveapi.cached.send({residence_list: 1})
             .then(function(data) {
               state.account.residence_list = data.residence_list.map(function(r) {
                 r.disabled = state.account.residence_unsupported.indexOf(r.value) !== -1;
                 return r;
               });
               state.account.residence = data.residence_list[0].value;
               liveapi.cached.send({website_status: 1})
                    .then(function(data){
                        var residence = data.website_status && data.website_status.clients_country;
                        if(state.account.residence_unsupported.indexOf(residence) === -1)
                          state.account.residence = residence || 'id';
                    })
                    .catch(function(err){
                      console.error(err);
                      state.account.residence = 'id'; // make indonesia default
                    })
             })
             .catch(function(err){
                console.error(err);
                $.growl.error({ message: err.message });
             });
    }

    return {
      init: init,
      login: function() {
          var app_id = liveapi.app_id;
          var config = local_storage.get('config');
          var oauth_url = (config && config.oauth_url) || 'https://oauth.binary.com/oauth2/authorize';
          window.location =  oauth_url + '?app_id=' + app_id + '&scope=read,trade,payments,admin';
      }
    }
});
