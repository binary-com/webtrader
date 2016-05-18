
define(['websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'moment', 'clipboard'], function(liveapi, windows, rv, moment, clipboard) {
    require(['text!token/token.html']);
    require(['css!token/token.css']);
    var token_win = null;
    var token_win_view = null;

    /* rivetjs clipboard copy binder */
    rv.binders['clipboard'] = {
        routine: function (el, text) {
          var clip = new clipboard(el, {
              text: function(trigger) { return text; }
          });

          clip.on('success', function() {
              $.growl.notice({ message: 'Copied "' + text + '"' });
          });

          clip.on('error', function() {
            $.growl.error({ message: 'Your browser doesn\'t support copy to clipboard' });
          });

          el._rv_clipboard_ && el._rv_clipboard_.destroy();
          el._rv_clipboard_ = clip;
        },
        unbind: function (el) {
          el._rv_clipboard_.destroy();
        }
    };

    function init($menuLink) {
      $menuLink.click(function () {
          if (!token_win)
              require(['text!token/token.html'], initTokenWin);
          else
              token_win.moveToTop();
      });
    }

    function init_state(root){
      var tooltip = "Note that tokens can possess one or more of these scopes: <br/>" +
                             "<b>read</b> - for API calls that only read client data<br/>" +
                             "<b>trade</b> - for API calls that can create trades in the client account<br/>" +
                             "<b>payments</b> - for API calls that can access the cashier<br/>" +
                             "<b>admin</b> - for API calls that change client settings";
      var state = {
        route: 'token-list',
        tokens: [],
        tooltip: tooltip,
        token: {
          name: '',
          scopes: {
            read: true,
            trade: false,
            payments: false,
            admin: false
          },
          btn_disabled: false,
        }
      };

      state.remove = function(token){
        liveapi.send({api_token:1, delete_token: token.token })
               .then(function(data){
                 var tokens = (data.api_token && data.api_token.tokens) || [];
                 state.update_tokens(tokens);
               })
               .catch(function(err){
                 $.growl.error({ message: err.message });
               });
      }

      state.change_route = function(route){
        state.route = route;
      }
      state.update_tokens = function(tokens){
         tokens.forEach(function(token) {
           var scopes = token.scopes;
           token.permissions = scopes.length == 4 ? 'All' : scopes.join(', ');

           token.last_used = token.last_used ? moment.utc(token.last_used, 'YYYY-MM-DD HH:mm:ss').fromNow() : '-';
         });
         state.tokens = tokens;
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
                  state.token.btn_disabled = false;
                  $.growl.notice({ message: 'Successfully added new token "' + request.new_token + '"'});

                  var tokens = (data.api_token && data.api_token.tokens) || [];
                  state.update_tokens(tokens);

                  state.change_route('token-list');
               })
               .catch(function (err) {
                  state.token.btn_disabled = false;
                  $.growl.error({ message: err.message });
                  console.error(err);
               });
      }

      token_win_view = rv.bind(root[0], state);
      return liveapi.send({api_token: 1})
             .then(function(data){
               var tokens = (data.api_token && data.api_token.tokens) || [];
               state.update_tokens(tokens);
             })
             .catch(function (err) {
                $.growl.error({ message: err.message });
                console.error(err);
             });
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
          'data-authorized': true,
          close: function () {
            token_win_view && token_win_view.unbind();
            token_win_view = null;
            token_win = null;
          },
          open: function () { },
      });
      init_state(root).then(function(){
        token_win.dialog('open');
      })
    }

    return {
      init: init
    }
});
