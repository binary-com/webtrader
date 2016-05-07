/*
 * Created by amin on May 1, 2016.
 */

define(['websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'lodash'], function(liveapi, windows, rv, _) {
    require(['text!oauth/login.html']);
    require(['css!oauth/login.css']);
    var login_win = null;
    var login_win_view = null; // rivets view

    function init() {
      if(login_win){
        login_win.moveToTop();
        return;
      }

      require(['text!oauth/login.html'], function(root) {
        root = $(root);
        login_win = windows.createBlankWindow(root, {
            title: 'Log in',
            resizable:false,
            collapsable:false,
            minimizable: false,
            maximizable: false,
            width: 408,
            height: 150,
            close: function () { },
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
        login_win.dialog("option", "position", { my: offset.left, at: offset.top });
      });
    }

    function init_state(root) {
      var state = {
        route: {
          value: 'login',
          update: function(route){
            var routes = {
              login: {
                title: 'Log in',
                height: 150
              },
              registeration: {
                title: 'Registeration',
                height: 180,
              },
              account: {
                title: 'Account opening',
                height: 440
              },
              confirm: {
                title: 'Confirm',
                height: 400
              },
              welcome: {
                title: 'Welcome',
                height: 400
              }
            };
            state.route.value = route;
            var title = routes[route].title;
            var height = routes[route].height;
            login_win.dialog('option', 'title', title);
            login_win.dialog('option', 'height', height);
          }
        },
        login: {
          login: function() {
            console.warn('login');
          }
        },
        registeration: {
          email: '',
          validate:{
            value: false,
            clear: _.debounce(function(){
              state.registeration.validate.value = false;
            }, 2000),
            show: function() {
              state.registeration.validate.value = true;
              state.registeration.validate.clear();
            }
          } ,
          create: function(){
            var email = state.registeration.email;
            if(email == '' || !validateEmail(email)) {
              state.registeration.validate.show();
              return;
            }

            state.route.update('account');
          }
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
          email_show_explanation: function() {
            var email = state.account.email;
            return (email === '' && !state.account.empty_fields.validate) || validateEmail(email);
          },
          password_error_message: function() {
            var password = state.account.password;
            if(password === '') return state.account.empty_fields.validate ? '* Please enter your password' : '';
            if(password.length < 6) return '* Password must be 6 characters minimum';
            if(! /\d/.test(password)) return '* Password must contain at least 1 digit';
            return '';
          },
          email: '',
          verification: '',
          password: '',
          repeat_password:  '',
          residence: 'my',
          residence_list: [ { text: 'Malaysia', value: 'my'}],
          open: function() {
            state.account.empty_fields.show();
          }
        }
      };
      login_win_view = rv.bind(root[0], state);
      _.defer(function() { state.route.update('account'); }, 500);

      liveapi.cached.send({residence_list: 1})
             .then(function(data) {
               state.account.residence_list = data.residence_list;
               state.account.residence = data.residence_list[0].value;
               _.defer(function() { state.account.residence = 'my' }, 0);
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
