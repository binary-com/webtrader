/*
 * Created by amin on May 19, 2016.
 */

define(['websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'lodash'], function(liveapi, windows, rv, _) {
    require(['text!password/password.html']);
    require(['css!password/password.css']);
    var password_win = null;
    var password_win_view = null;

    function init($menuLink) {
      $menuLink.click(function () {
        if (!password_win)
          require(['text!password/password.html'], init_password_win);
        else
          password_win.moveToTop();
      });
    }

    function init_password_win(root) {
      root = $(root).i18n();
      password_win = windows.createBlankWindow(root, {
          title: 'Change password'.i18n(),
          resizable:false,
          collapsable:false,
          minimizable: false,
          maximizable: false,
          // width: 408,
          height: 350,
          'data-authorized': true,
          close: function () {
            password_win.dialog('destroy');
            password_win.remove();
            password_win = null;
          },
          open: function () { },
          destroy: function() {
            password_win_view && password_win_view.unbind();
            password_win_view = null;
          }
      });

      init_state(root);
      password_win.dialog('open');
    }

    function init_state(root) {
      var state = {
        empty_fields: {
          validate: false,
          clear: _.debounce(function() {
            state.empty_fields.validate = false;
          }, 2000),
          show: function() {
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

      state.password_error_message = function() {
        var password = state.account.new_password;
        if(password === '') return state.empty_fields.validate ? '* Please enter your new password'.i18n() : '';
        if(password.length < 6) return '* Password must be 6 characters minimum'.i18n();
        if(!/\d/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password)) return '* Password must contain uppercase letters and numbers'.i18n();
        return '';
      };

      state.btn.change = function() {
        state.empty_fields.show();
        var account = state.account;
        if(state.account.password === ''
            || state.password_error_message() !== ''
            || state.account.new_password !== state.account.verify_password) {
            return;
        }
        var request = {
          change_password: 1,
          old_password: state.account.password,
          new_password: state.account.new_password
        };
        state.btn.disabled = true;
        liveapi.send(request)
               .then(function(data){
                 if(data.change_password !== 1){
                   throw { message: 'Failed to update the password'.i18n()};
                 }
                 state.btn.disabled = false;
                 $.growl.notice({ message: 'Password successfully updated.'.i18n()});
                 $.growl.notice({ message: 'Redirecting to oauth login page,<br/>Please use your new password to login.'.i18n()});
                 require(['oauth/login'], function(login){
                   _.defer(function(){
                     login.login();
                   },1000);
                 });
                 password_win.dialog('close');
               })
               .catch(function(err){
                 state.btn.disabled = false;
                 $.growl.error({ message: err.message});
               })
      }

      password_win_view = rv.bind(root[0], state);
    }

    return {
      init: init
    }
});
