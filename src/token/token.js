/* created by amin, on May 18, 2016 */

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
            $.growl.error({ message: 'Your browser doesn\'t support copy to clipboard'.i18n() });
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
      var tooltip = 'Note that tokens can possess one or more of these scopes: <br/>'.i18n() +
                             '<b>read</b> - for API calls that only read client data<br/>'.i18n() +
                             '<b>trade</b> - for API calls that can create trades in the client account<br/>'.i18n() +
                             '<b>payments</b> - for API calls that can access the cashier<br/>'.i18n() +
                             '<b>admin</b> - for API calls that change client settings'.i18n();
      var state = {
        route: 'token-list',
        search_input: '',
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
        },
        confirm: {
          visible: false,
          top: '0px',
          token: {}
        }
      };

      state.tokens_filtered = function() {
        var txt = state.search_input.toLowerCase();
        return state.tokens.filter(function(token){
          return txt === ''
                || token.display_name.toLowerCase().indexOf(txt) !== -1
                || token.token.toLowerCase().indexOf(txt) !== -1
                || token.permissions.toLowerCase().indexOf(txt) !== -1;
        });
      }

      state.confirm.show = function(e){
        var span = $(e.target);
        var top = span.position().top - span.parent().parent().height();
        var token = span.attr('token-id');
        token = _.find(state.tokens, { token: token });
        state.confirm.top = top + 'px';
        state.confirm.visible = true;
        state.confirm.token = token;

      }
      state.confirm.no = function() {
        state.confirm.visible = false;
      }
      state.confirm.yes = function(){
        var token = state.confirm.token;
        state.confirm.visible = false;
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
        if(route !== 'token-list')
          state.confirm.visible = false;
        state.route = route;
      }
      state.update_tokens = function(tokens){
         tokens.forEach(function(token) {
           var scopes = token.scopes;
           token.permissions = scopes.length == 4 ? 'All' : scopes.join(', ');

           token.last_used_tooltip = token.last_used;
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
          error_msg = 'Please choose at least one token scope'.i18n();
        if(!request.new_token || !request.new_token.length)
          error_msg = 'Please enter the token name'.i18n();

        if(error_msg) {
          $.growl.error({ message: error_msg });
          return;
        }

        state.token.btn_disabled = true;
        liveapi.send(request)
               .then(function(data){
                  state.token.name = '';
                  state.token.btn_disabled = false;
                  $.growl.notice({ message: 'Successfully added new token "'.i18n() + request.new_token + '"'});

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
      root = $(root).i18n();
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
            token_win.destroy();
            token_win = null;
          },
          open: function () { },
      });
      token_win.track({
        module_id: 'token',
        is_unique: true,
        data: null
      });
      init_state(root).then(function(){
        token_win.dialog('open');
      })
    }

    return {
      init: init
    }
});
