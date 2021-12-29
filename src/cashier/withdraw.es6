import $ from 'jquery';
import liveapi from 'websockets/binary_websockets';
import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import tncApprovalWin from 'cashier/uk_funds_protection';
import html from 'text!cashier/withdraw.html';

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
            if (!win) {
                liveapi.cached.authorize().then(() => {
                    this._init_win(html)
                }).catch(error_handler);
            } else
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
                win.trigger('dialogclose'); // TODO: figure out why event is not fired.
                win.remove();
                win = null;
            },
            open: () => {},
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
        win.track({
            module_id: 'withdraw',
            is_unique: true
        });
    };

    _init_state = root => {
        var state = {
            clear: _.debounce((obj, prop) => { obj[prop] = false }, 4000),
            route: { value: 'menu' },
            empty_fields: {
                validate: false,
                token_length: false,
                show: () => {
                    state.empty_fields.validate = true;
                    state.clear(state.empty_fields, 'validate');
                }
            },
            validate: {
                invalid_length: false,
                invalid_text: false,
                length: () => {
                    if (state.verify.token.length != 8) {
                        state.validate.invalid_length = true;
                        state.clear(state.validate, 'invalid_length');
                        return false;
                    }
                    return true;
                },
                text: () => {
                    if (/[^1-9a-zA-Z'\- ,.]/g.test(state.agent.instructions)) {
                        state.validate.invalid_text = true;
                        state.clear(state.validate, "invalid_text");
                        return false;
                    }
                    return true;
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
                value: []
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
                min_amount: '',
                max_amount: '',
                hint: '',
                currency: local_storage.get('authorize').currency,
                residence: '',
                instructions: '',
                checkAmount: (e, scope) => {
                    const amount = scope.agent.amount;
                    if (amount === '') {
                        return;
                    }
                    if (amount > scope.agent.max_amount) {
                        scope.agent.amount = scope.agent.max_amount;
                    }
                    if (amount < 0) {
                        scope.agent.amount = '';
                    }
                }
            },
            login_details: loginids().reduce(function(a, b) {
                if (a.id === local_storage.get("authorize").loginid) return a;
                else return b
            })
        };
        let { route, menu, verify, empty_fields, standard, agent, transfer, validate } = state;

        let routes = { menu: 400, verify: 400, transfer: 400, 'transfer-done': 300, standard: 400, agent: 550, 'agent-confirm': 400, 'agent-done': 300 };
        route.update = r => {
            route.value = r;
            win.dialog('option', 'height', routes[r]);
        };

        menu.click = choice => { /* choice is 'transfer', 'agent' or 'standard' */
            menu.choice = choice;
            route.update(choice !== 'transfer' ? 'verify' : 'transfer');

            if (choice === 'transfer')
                return;

            const email = local_storage.get('authorize').email;
            const type = choice === 'agent' ? 'paymentagent_withdraw' : 'payment_withdraw';

            if(isCryptoCurrency(agent.currency) && (agent.currency !== 'DAI' || agent.currency !== 'UST')) {
                agent.min_amount = 0.002;
                agent.max_amount = 5;
            } else {
                agent.min_amount = 10;
                agent.max_amount = 2000;
            }

            agent.hint = `Min: ${agent.min_amount} Max: ${agent.max_amount}`.i18n();
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
            if (!verify.token) {
                empty_fields.show();
                return;
            }

            if (!validate.length()) {
                return;
            }

            if (menu.choice === 'standard') {
                verify.disabled = true;
                liveapi.send({
                        cashier: 'withdraw',
                        verification_code: verify.token
                    })
                    .then(data => {
                        if (data.cashier.startsWith('ASK_')) { /* error code */
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
                        if (err.code === "ASK_UK_FUNDS_PROTECTION") {
                            tncApprovalWin.init_win().then().catch(err => {
                                error_handler(err);
                            });
                            return;
                        }
                        error_handler(err);
                    });
            } else if (menu.choice === 'agent') {
                verify.code = verify.token;
                verify.token = '';
                route.update('agent');
            }
        };

        standard.iframe_loaded = () => {
            if (standard.url)
                standard.iframe_visible = true;
        };

        agent.onchanged = () => {
            if (agent.loginid) {
                let { withdrawal_commission, name } = agent.agents.find(a => a.paymentagent_loginid === agent.loginid);
                agent.commission = withdrawal_commission;
                agent.name = name;
            } else {
                agent.commission = '';
                agent.name = '';
            }
        }

        agent.amount_with_commission = () => {
            var with_commission = (agent.amount || 0) * (100 - agent.commission) / 100;
            return with_commission.toFixed(2);
        }

        agent.click = () => {
            if (!agent.loginid) {
                $.growl.error({ message: 'Please select a payment agent'.i18n() });
                return;
            }
            if (!(agent.amount >= agent.min_amount && agent.amount <= agent.max_amount)) {
                $.growl.error({ message: `Amount Min: ${agent.min_amount} Max: ${agent.max_amount}`.i18n() });
                return;
            }
            if (agent.instructions && !validate.text()) {
                return;
            }

            route.update('agent-confirm');
        }

        agent.confirm_transfer = () => {
            var request = {
                paymentagent_withdraw: 1,
                paymentagent_loginid: agent.loginid,
                currency: agent.currency,
                amount: agent.amount * 1,
                description: agent.instructions,
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
            if (transfer.account === '' || transfer.amount === '') {
                empty_fields.show();
                return;
            }
            var req = {
                transfer_between_accounts: 1,
                account_from: transfer.account.split("_to_")[0],
                account_to: transfer.account.split("_to_")[1],
                currency: agent.currency,
                amount: transfer.amount
            };
            transfer.disabled = true;
            liveapi.send(req)
                .then(data => {
                    transfer.account = transfer.account.split("_to_")[1];
                    route.update('transfer-done');
                })
                .catch(err => {
                    error_handler(err);
                    transfer.disabled = false;
                });
        }

        transfer.isAvailable = () => {
            if (state.login_details.is_mlt || state.login_details.is_mf) {
                let is_upgradable = true;
                loginids().forEach((id) => {
                    if (id.id !== state.login_details.id && (id.is_mf || id.is_mlt)) {
                        is_upgradable = false;
                        transfer.value = [{
                            value: state.login_details.id + "_to_" + id.id,
                            text: "from account (" + state.login_details.id +
                                ") to account (" + id.id + ")"
                        }];
                        transfer.value.push({
                            value: id.id + "_to_" + state.login_details.id,
                            text: "from account (" + id.id +
                                ") to account (" + state.login_details.id + ")"
                        });
                        transfer.account = transfer.value[0].value;
                    }
                });

                return !is_upgradable;
            }
        }

        liveapi.cached.send({ get_settings: 1 })
            .then(data => {
                agent.residence = data.get_settings.country_code;
                const currency = local_storage.get('currency');
                return liveapi.cached.send({ paymentagent_list: agent.residence, currency  });
            })
            .then(data => {
                agent.agents = data.paymentagent_list.list;
            })
            .catch(error_handler);

        liveapi.send({ payout_currencies: 1 })
            .then(data => {
                agent.currency = data.payout_currencies[0];
            }).catch(err => console.error(err));

        win_view = rv.bind(root[0], state);
    };
};

export default new Withdraw();
