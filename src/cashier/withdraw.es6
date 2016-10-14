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
        root = $(root).i18n();
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
            code: '',
            disabled: false,
          },
          transfer: {
            disabled: false,
            account: '',
            amount: '',
            loginid: local_storage.get('authorize').loginid,
          },
          standard: {
            url: '',
            iframe_visible: false
          },
          agent: {
            disabled: false,
            loginid: '',
            name: '',
            agents: [],
            commission: '',
            amount: '',
            currency: local_storage.get('authorize').currency,
            residence: '',
            instructions: '',
          },
        };
        let {route, menu, verify, empty_fields, standard, agent, transfer} = state;

        let routes = { menu : 400, verify: 400, transfer: 400, 'transfer-done': 300, standard: 400, agent: 550, 'agent-confirm': 400, 'agent-done': 300 };
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

        verify.back = () => {
          verify.token = verify.code = '';
          route.update('menu');
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
              verify.disabled = false;
              route.update('standard');
              verify.code = verify.token;
              verify.token = '';
            })
            .catch(err => {
              verify.disabled = false;
              error_handler(err);
            });
          }
          else if(menu.choice == 'agent') {
            verify.code = verify.token;
            verify.token = '';
            route.update('agent');
          }
        };

        standard.iframe_loaded = () => {
          if(standard.url)
            standard.iframe_visible = true;
        };

        agent.onchanged = () => {
          if(agent.loginid) {
            let {withdrawal_commission, name} = agent.agents.find(a => a.paymentagent_loginid == agent.loginid);
            agent.commission = withdrawal_commission;
            agent.name = name;
          }
          else {
            agent.commission = '';
            agent.name = '';
          }
        }

        agent.amount_with_commission = () => {
            var with_commission = (agent.amount || 0)*(100 - agent.commission)/100;
            return with_commission.toFixed(2);
        }

        agent.click = () => {
          if(!agent.loginid) {
            $.growl.error({message: 'Please select a payment agent'.i18n()});
            return;
          }
          if(!(agent.amount >= 10 && agent.amount <= 2000)) {
            $.growl.error({message: 'Amount Min: 10 Max: 2000'.i18n()});
            return;
          }
          if(!agent.instructions) {
            empty_fields.show();
            return;
          }

          route.update('agent-confirm');
        }

        agent.confirm_transfer = () => {
          var request = {
            paymentagent_withdraw: 1,
            paymentagent_loginid: agent.loginid,
            currency: agent.currency,
            amount: agent.amount*1,
            verification_code: verify.code
          };
          agent.disabled = true;
          liveapi.send(request)
                 .then(data => {
                   route.update('agent-done')
                   agent.disabled = false;
                 })
                 .catch(err => {
                    agent.disabled = false;
                    route.update('menu') // because tokens are one time use.
                    error_handler(err);
                 });
        }

        transfer.submit = () => {
          if(transfer.account === '' || transfer.amount === '') {
            empty_fields.show();
            return;
          }
          var req = {
            transfer_between_accounts: 1,
            account_from: transfer.loginid,
            account_to: transfer.account,
            currency: agent.currency,
            amount: transfer.amount
          };
          transfer.disabled = true;
          liveapi.send(req)
            .then(data => {
              if(data.transfer_between_accounts === 0) {
                $.growl.error({message: 'Transfering funds between accounts failed'.i18n() });
                return;
              }
              route.update('transfer-done');
            })
            .catch(err => {
              error_handler(err);
              transfer.disabled = false;
            });
        }

        liveapi.send({get_settings: 1})
               .then(data => {
                 agent.residence = data.get_settings.country_code;
                 return liveapi.cached.send({paymentagent_list: agent.residence });
               })
               .then(data => {
                 agent.agents = data.paymentagent_list.list;
               })
               .catch(error_handler);

        liveapi.send({payout_currencies: 1})
            .then(data => {
                agent.currency = data.payout_currencies[0];
            }).catch(err => console.error(err));

        win_view = rv.bind(root[0], state);
      };
    };

    return new Withdraw();
});
