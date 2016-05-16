
define(['websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'lodash'], function(liveapi, windows, rv, _) {
    require(['text!token/token.html']);
    require(['css!token/token.css']);
    var token_win = null;
    var token_win_view = null;

    function init($menuLink) {
      $menuLink.click(function () {
          if (!token_win)
              require(['text!token/token.html'], initTokenWin);
          else
              token_win.moveToTop();
      });
    }

    function init_state(root){
      var state = {
        route: 'token-list',
        tokens: [],
        tooltip: "Note that tokens can possess one or more of these scopes: <br/>" +
                             "<b>read</b> - for API calls that only read client data<br/>" +
                             "<b>trade</b> - for API calls that can create trades in the client account<br/>" +
                             "<b>payments</b> - for API calls that can access the cashier<br/>" +
                             "<b>admin</b> - for API calls that change client settings",
        token: {
          name,
          scopes: {
            read: true,
            trade: false,
            payments: false,
            admin: false
          },
          btn_disabled: false,
        }
      };

      state.change_route = function(route){
        state.route = route;
      }

      state.token.add = function(){
        var request = {
          api_token: 1,
          new_token: state.token.name,
          new_token_scopes: []
        };

        state.token.scopes.read && request.new_token_scopes.push('read');
        state.token.scopes.trade && request.new_token_scopes.push('trade');
        state.token.scopes.payments && request.new_token_scopes.push('payments');
        state.token.scopes.admin && request.new_token_scopes.push('admin');

        var error_msg = '';

        if(!request.new_token_scopes.length)
          error_msg = 'Please choose at least one token scope';
        if(!request.new_token || !request.new_token.length)
          error_msg = 'Please enter the token name';

        if(error_msg) {
          $.growl.error({ message: error_msg });
          return;
        }

        state.token.btn_disabled = true;
        liveapi.send(request)
               .then(function(data){
                  console.warn(data.api_token);
                  state.token.btn_disabled = false;
                  state.tokens = data.api_token.tokens;
                  $.growl.notice({ message: 'Successfully added new token "' + request.new_token + '"'});
                  state.change_route('token-list');
               })
               .catch(function (err) {
                  state.token.btn_disabled = false;
                  $.growl.error({ message: err.message });
                  console.error(err);
               });
      }

      token_win_view = rv.bind(root[0], state);
    }

    function initTokenWin(root) {
      root = $(root);
      token_win = windows.createBlankWindow(root, {
          title: 'Token management',
          resizable: false,
          collapsable:false,
          minimizable: true,
          maximizable: false,
          width: 700,
          minHeight: 60,
          close: function () { },
          open: function () { },
          destroy: function() {
            token_win_view && token_win_view.unbind();
            token_win_view = null;
          }
      });
      init_state(root);
      token_win.dialog('open');
      window.tkn = token_win;
    }

    return {
      init: init
    }
});
