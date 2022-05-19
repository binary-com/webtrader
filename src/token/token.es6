/* created by apoorv, on Jan 31 2017 */
import liveapi from 'websockets/binary_websockets';
import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import moment from 'moment';
import clipboard from 'clipboard';
import html from 'text!token/token.html';
import {find} from 'lodash';
import 'css!token/token.css';

let token_win = null;
let token_win_view = null;

/* rivetjs clipboard copy binder */
rv.binders['clipboard'] = {
    routine: (el, text) => {
        const clip = new clipboard(el, {
            text: (trigger) => {
                return text;
            }
        });

        clip.on('success', () => {
            $.growl.notice({ message: 'Copied "' + text + '"' });
        });

        clip.on('error', () => {
            $.growl.error({ message: 'Your browser doesn\'t support copy to clipboard'.i18n() });
        });

        el._rv_clipboard_ && el._rv_clipboard_.destroy();
        el._rv_clipboard_ = clip;
    },
    unbind: (el) => {
        el._rv_clipboard_.destroy();
    }
};

const init_state = (root) => {
    const state = {
        route: 'token-list',
        search_input: '',
        tokens: [],
        token: {
            name: '',
            scopes: {
                read: true,
                trade: false,
                payments: false,
                admin: false
            },
            btn_disabled: false,
            checkTokenName: (e,scope) => {
              let token_name = scope.token.name;
              if(token_name.length > 32){
                $.growl.error({message:"Token name can have a maximum of 32 characters".i18n()});
                scope.token.name = token_name.substr(0,32);
              }
              if(token_name.match(/[^\w\s]+/g) != null){
                $.growl.error({message:"Token name can contain alphanumeric characters with spaces and underscores".i18n()});
                scope.token.name = token_name.replace(/[^\w\s]+/g, "");
              }
              if(!/^[\w]/.test(token_name)){
                $.growl.error({message:"Token name should begin with alphanumeric characters only".i18n()});
                scope.token.name = token_name.replace(/^[^\w]+/g, "");
              }
            }
        },
        confirm: {
            visible: false,
            top: '0px',
            token: {}
        }
    };

    state.tokens_filtered = () => {
        const txt = state.search_input.toLowerCase();
        return state.tokens.filter((token) => {
            return txt === '' || token.display_name.toLowerCase().indexOf(txt) !== -1 || token.token.toLowerCase().indexOf(txt) !== -1 || token.permissions.toLowerCase().indexOf(txt) !== -1;
        });
    }

    state.confirm.show = (e) => {
        const span = $(e.target);
        const top = span.position().top - span.parent().parent().height();
        let token = span.attr('token-id');
        token = find(state.tokens, { token: token });
        state.confirm.top = top + 'px';
        state.confirm.visible = true;
        state.confirm.token = token;

    }
    state.confirm.no = () => {
        state.confirm.visible = false;
    }
    state.confirm.yes = () => {
        const token = state.confirm.token;
        state.confirm.visible = false;
        liveapi.send({ api_token: 1, delete_token: token.token })
            .then((data) => {
                const tokens = (data.api_token && data.api_token.tokens) || [];
                state.update_tokens(tokens);
            })
            .catch((err) => {
                $.growl.error({ message: err.message });
            });
    }

    state.change_route = (route) => {
        if (route !== 'token-list')
            state.confirm.visible = false;
        state.route = route;
    }
    state.update_tokens = (tokens) => {
        tokens.forEach((token) => {
            const scopes = token.scopes;
            token.permissions = scopes.length == 4 ? 'All' : scopes.join(', ');

            token.last_used_tooltip = token.last_used;
            token.last_used = token.last_used ? moment.utc(token.last_used, 'YYYY-MM-DD HH:mm:ss').fromNow() : '-';
        });
        state.tokens = tokens;
    }

    state.token.add = () => {
        if(state.token.name.length < 2){
          $.growl.error({message:"Token name must contain atleast 2 characters".i18n()});
          return;
        }

        const request = {
            api_token: 1,
            new_token: state.token.name,
            new_token_scopes: []
        };

        state.token.scopes.read && request.new_token_scopes.push('read');
        state.token.scopes.trade && request.new_token_scopes.push('trade');
        state.token.scopes.payments && request.new_token_scopes.push('payments');
        state.token.scopes.admin && request.new_token_scopes.push('admin');

        let error_msg = '';

        if (!request.new_token_scopes.length)
            error_msg = 'Please choose at least one token scope'.i18n();
        if (!request.new_token || !request.new_token.length)
            error_msg = 'Please enter the token name'.i18n();

        if (error_msg) {
            $.growl.error({ message: error_msg });
            return;
        }

        state.token.btn_disabled = true;
        liveapi.cached.authorize().then(() => {
            liveapi.send(request).then((data) => {
                state.token.name = '';
                state.token.btn_disabled = false;
                $.growl.notice({ message: `${'Successfully added new token '.i18n()} ${request.new_token}` });
    
                const tokens = (data.api_token && data.api_token.tokens) || [];
                state.update_tokens(tokens);

                state.change_route('token-list');
            }).catch((err) => {
                state.token.btn_disabled = false;
                $.growl.error({ message: err.message });
                console.error(err);
            });
        })
        .catch((err) => {
            $.growl.error({ message: err.message });
        });
    }

    token_win_view = rv.bind(root[0], state);
    return liveapi.send({ api_token: 1 })
        .then((data) => {
            const tokens = (data.api_token && data.api_token.tokens) || [];
            state.update_tokens(tokens);
        })
        .catch((err) => {
            $.growl.error({ message: err.message });
            console.error(err);
        });
}

const initTokenWin = (root) => {
    root = $(root).i18n();
    token_win = windows.createBlankWindow(root, {
        title: 'Token management'.i18n(),
        resizable: false,
        collapsable: false,
        minimizable: true,
        maximizable: false,
        width: 700,
        minHeight: 60,
        'data-authorized': true,
        close: () => {
            token_win_view && token_win_view.unbind();
            token_win_view = null;
            token_win.destroy();
            token_win = null;
        }
    });
    token_win.track({
        module_id: 'token',
        is_unique: true,
        data: null
    });
    init_state(root).then(() => {
        token_win.dialog('open');
    })
}

export const init = ($menuLink) => {
    $menuLink.click(() => {
        if (!token_win)
            initTokenWin(html);
        else
            token_win.moveToTop();
    });
}

export default {
    init
}
