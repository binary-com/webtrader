/*
 * Created by amin on May 1, 2016.
 */

define(['websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra'], function(liveapi, windows, rv) {
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
      });
    }

    function init_state(root) {
      var state = {
        route: {
          value: 'login',
          update: function(route){
            var titles = {
              login: 'Log in',
              registeration: 'Registeration',
              account: 'Account opening',
              confirm: 'Confirm',
              welcome: 'Welcome'
            };
            state.route.value = route;
            var title = titles[route];
            login_win.dialog('option', 'title', title);
          }
        },
        login: {
          login: function() {
            console.warn('login');
          }
        },
        registeration: {
          email: '',
          create: function(){
            var email = state.registeration.email;
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
