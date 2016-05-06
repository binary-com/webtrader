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
                height: 400
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
          validation: '',
          clear_validation: _.debounce(function(){
            state.registeration.validation = '';
          }, 2000),
          create: function(){
            var email = state.registeration.email;

            if(email == '')
              state.registeration.validation = '* Please enter you email.';
            else if(!validateEmail(email))
              state.registeration.validation = '* Email address is not valid.';

            if(state.registeration.validation){
              state.registeration.clear_validation();
              return;
            }

            console.warn(email);
          }
        }
      };
      login_win_view = rv.bind(root[0], state);
    }

    return {
      init: init
    }
});
