/*
 * Created by amin on May 1, 2016.
 */

define(['websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'lodash'], function(liveapi, windows, rv, _) {
    require(['text!oauth/login.html']);
    require(['text!oauth/app_id.json']);
    require(['css!oauth/login.css']);
    var login_win = null;
    var login_win_view = null; // rivets view

    function init() {
      if(login_win){
        login_win.moveToTop();
        return;
      }

      require(['text!oauth/login.html', 'text!oauth/app_id.json'], function(root, app_id) {
        app_id = JSON.parse(app_id);

        /* find the appropriate token */
        var token = '';
        var href = window.location.href;
        for(var web_address in app_id) {
          if(href.lastIndexOf(web_address,0) == 0) {
            token = app_id[web_address];
            break;
          }
        }

        root = $(root);
        login_win = windows.createBlankWindow(root, {
            title: 'Log in',
            resizable:false,
            collapsable:false,
            minimizable: false,
            maximizable: false,
            width: 408,
            height: 150,
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
        init_state(root, token);
        login_win.dialog('open');

        /* update dialog position, this way when dialog is resized it will not move*/
        var offset = login_win.dialog('widget').offset();
        offset.top = 80;
        login_win.dialog("option", "position", { my: offset.left, at: offset.top });
        login_win.dialog('widget').css({
            left: offset.left + 'px',
            top: offset.top + 'px'
        });
      });
    }

    function init_state(root, token) {
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
            if(password === '') return state.account.empty_fields.validate ? '* Please enter your password' : '';
            if(password.length < 6) return '* Password must be 6 characters minimum';
            if(!/\d/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password)) return '* Password must contain lower and uppercase letters with numbers';
            return '';
          },
          verification: '',
          password: '',
          repeat_password:  '',
          residence: 'my',
          residence_list: [ { text: 'Malaysia', value: 'my'}],
          disabled: false, /* is button disabled */
        },
        confirm: { disabled: false }
      };

      state.login.login = function() {
          state.login.disabled = true;
          window.location = 'https://www.binary.com/oauth2/authorize?app_id=' + token + '&scope=read,trade,payments,admin';
      }

      state.confirm.confirm = function() {
          state.confirm.disabled = true;
          window.location = 'https://www.binary.com/oauth2/authorize?app_id=' + token + '&scope=read,trade,payments,admin';
      }

      state.route.update = function(route){
        var routes = {
          login: {
            title: 'Log in',
            height: 150
          },
          registration: {
            title: 'Registration',
            height: 190,
          },
          account: {
            title: 'Account opening',
            height: 420
          },
          confirm: {
            title: 'Account opening',
            height: 400
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

      /* { verify_email: 'emial' } step */
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
                    $.growl.notice({ message: 'Verification code sent to ' + email });
                    state.route.update('account');
                  }
                  else  {
                    throw { message: 'Email verification failed (' + data.msg_type + ')' };
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
                  localStorage.setItem('oauth_token', account.oauth_token);
                  localStorage.setItem('client_id', account.client_id)
                  liveapi.cached.authorize().catch(function(err) { console.error(err.message) });
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
               state.account.residence_list = data.residence_list;
               state.account.residence = data.residence_list[0].value;
               _.defer(function() { state.account.residence = 'id' }, 0); // make indonesia default
             })
             .catch(function(err){
                console.error(err);
                $.growl.error({ message: err.message });
             });
    }

    return {
      init: init
    }
});
