/*
 * Created by amin on July 16, 2016.
 */

define(['jquery', 'websockets/binary_websockets', 'windows/windows', 'common/rivetsExtra', 'lodash', 'moment'], function($, liveapi, windows, rv, _, moment) {
    require(['text!cashier/withdraw.html']);
    require(['css!cashier/withdraw.css']);

    let win = null;
    let win_view = null;

    let error_handler = err => {
      console.error(err);
      $.growl.error({ message: err.message });
    };

    class Withdraw {
      init = li => {
        li.click(() => {
            if(!win)
              require(['text!cashier/withdraw.html'], this._init_win);
            else
              win.moveToTop();
        });
      }

      _init_win = root => {
        root = $(root);
        win = windows.createBlankWindow(root, {
            title: 'Withdraw funds',
            resizable: true,
            collapsable: false,
            minimizable: true,
            maximizable: true,
            width: 700,
            height: 400,
            'data-authorized': true,
            close: () => {
              win.dialog('destroy');
              win.trigger('dialogclose'); // TODO: figure out why event is not fired.
              win.remove();
              win = null;
            },
            open: () => { },
            destroy: () => {
              win_view && win_view.unbind();
              win_view = null;
            }
        });

        this._init_state(root);
        win.dialog('open');

        /* update dialog position, this way when dialog is resized it will not move*/
        var offset = win.dialog('widget').offset();
        offset.top = 110;
        win.dialog("option", "position", { my: offset.left, at: offset.top });
        win.dialog('widget').css({
            left: offset.left + 'px',
            top: offset.top + 'px'
        });
        win.fixFooterPosition();
        win.track({
          module_id: 'withdraw',
          is_unique: true
        });
      };

      _init_state = root => {
        var state = {
          route: { value: 'menu'},
          empty_fields: {
            validate: false,
            clear: _.debounce(() => ( state.empty_fields.validate = false ), 4000),
            show: () => {
              state.empty_fields.validate = true;
              state.empty_fields.clear();
            }
          },
          menu: {
            choice: ''
          },
          verify: {
            token: '',
            disabled: false,
          },
          standard: {
            url: '',
            iframe_visible: false
          },
          agent: {
            disabled: false,
            loginid: '',
            agents: [],
            commission: '',
            amount: 10,
            currency: local_storage.get('authorize').currency,
            residence: '',
            instructions: '',
            amount_with_commission: 0
          }
        };
        let {route, menu, verify, empty_fields, standard, agent} = state;

        let routes = { menu : 400, transfer: 400, standard: 400, agent: 550, verify: 400 };
        route.update = r => {
          route.value = r;
          win.dialog('option', 'height', routes[r]);
        };

        menu.click = choice => { /* choice is 'transfer', 'agent' or 'standard' */
          menu.choice = choice;
          route.update(choice !== 'transfer' ? 'verify' : 'transfer');
          if(choice === 'transfer')
            return;
          const email = local_storage.get('authorize').email;
          const type = choice === 'agent' ? 'paymentagent_withdraw' : 'payment_withdraw';
          liveapi.send({
            verify_email: email,
            type: type
          })
          .then(() => $.growl.notice({ message: 'Verification code sent to '.i18n() + email }))
          .catch(err => {
            error_handler(err);
            route.update('menu');
          });
        };

        verify.unlock = () => {
          if(!verify.token) {
            empty_fields.show();
            return;
          }

          if(menu.choice === 'standard') {
            verify.disabled = true;
            liveapi.send({
              cashier: 'withdraw',
              verification_code: verify.token
            })
            .then(data => {
              if(data.cashier.startsWith('ASK_')) { /* error code */
                throw new Error(data.cashier);
              }
              standard.url = data.cashier;
              console.warn(standard.url);
              verify.disabled = false;
              route.update('standard');
              verify.token = '';
            })
            .catch(err => {
              verify.disabled = false;
              error_handler(err);
            });
          }
          else if(menu.choice == 'agent') {
            route.update('agent');
          }
        };

        standard.iframe_loaded = () => {
          if(standard.url)
            standard.iframe_visible = true;
        };

        agent.onchanged = () => {
          if(agent.loginid) {
            agent.commission
              = agent.agents.find(a => a.paymentagent_loginid == agent.loginid).withdrawal_commission;
          }
          else {
            agent.commission = '';
          }
          console.warn(agent.commission);
        }

        agent.click = () => {
          console.warn('clicked');
        }

        liveapi.send({get_settings: 1})
               .then(data => {
                 agent.residence = data.get_settings.country_code;
                 return liveapi.cached.send({paymentagent_list: agent.residence });
               })
               .then(data => {
                 agent.agents = data.paymentagent_list.list;
                 console.warn(agent.agents);
               })
               .catch(error_handler);

        _.defer(() => route.update('agent'));
        win_view = rv.bind(root[0], state);
      };
    };

    return new Withdraw();
});
