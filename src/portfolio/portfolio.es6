/**
 * Created by amin on 10/9/15.
 */

import $ from 'jquery';
import windows from '../windows/windows';
import liveapi from '../websockets/binary_websockets';
import 'jquery-ui';
import 'datatables';
import 'jquery-growl';
import 'css!./portfolio.css';

let portfolioWin = null;
let table = null;
let balance_span = null;
let subscribed_contracts = [];

export const init = (li) => {
    li.click(() => {
        if(!portfolioWin)
            initPortfolioWin();
        else
            portfolioWin.moveToTop();
    });
}

const update_indicative = (data) => {
    if(data.error)
        return;

    const contract = data.proposal_open_contract;
    const id = contract.contract_id,
        bid_price = contract.bid_price;

    if (table) {
        const row = table.api().row('#' + id);
        const cols = row.data();
        if(!cols)
            return; /* table might be empty */
        const perv_indicative = cols[3];
        cols[3] = bid_price; /* update the indicative column */
        row.data(cols);

        /* colorize indicative column on change */
        const tr = table.find('#' + id);
        if(!contract.is_valid_to_sell) {
            tr.removeClass('indicative-red indicative-green').addClass('resale-not-offered');
        } else {
            tr.removeClass('resale-not-offered');
            if(perv_indicative !== bid_price) {
            tr.removeClass('indicative-red indicative-green')
                .addClass((perv_indicative*1 < bid_price*1) ? 'indicative-green' : 'indicative-red');
            }
        }
    }
}

let subscribed_before = false;
let subscribers = 0;
liveapi.events.on('logout',() => {
    subscribed_before = false;
    subscribers = 0;
});

/* command could be 'subscribe','forget' and 'resubscribe'. */
const proposalOpenContract = (command) => {
    if(command === 'subscribe') {
        ++subscribers;
        if(!subscribed_before && subscribers > 0) {
            liveapi.send({ proposal_open_contract: 1,subscribe: 1 })
                .then((data) => { subscribed_before = true; })
                .catch((err) => {
                    console.error(err);
                    $.growl.error({ message: err.message });
                });
        }
    }
    else if(command === 'forget') {
        --subscribers;
        if(subscribed_before && subscribers === 0) {
            liveapi.send({ forget_all: 'proposal_open_contract' })
                .then((data) => {
                    subscribed_before = false;
                })
                .catch((err) => {
                    subscribed_before = false;
                    console.error(err.message);
                });
        }
    }
    else if( command === 'resubscribe' ) {
        liveapi.send({ forget_all: 'proposal_open_contract' })
            .then((data) => {
                subscribed_before = false;
                --subscribers;
                proposalOpenContract('subscribe'); /* subscribe again */
            })
            .catch((err) => {
                subscribed_before = false;
                console.error(err.message);
            });
    }
    else {
        console.error('wrong command!');
        return;
    }
}

const on_arrow_click =(e) => {
    const target = e.target;
    const $target = $(target);
    if(target.tagName !== 'BUTTON' || $target.hasClass('button-disabled'))
    return;
    const tr = target.parentElement.parentElement;
    let transaction = table.api().row(tr).data();
    transaction = _.last(transaction);
    $target.addClass('button-disabled');
    require(['viewtransaction/viewTransaction'],(viewTransaction) => {
    viewTransaction.init(transaction.contract_id, transaction.transaction_id)
                    .then(() => $target.removeClass('button-disabled')).catch((err)=>{
                        $target.removeClass('button-disabled');
                    });
    });
}

const initPortfolioWin = () => {
    /* refresh blance on blance change */
    let currency = '';
    const on_balance = liveapi.events.on('balance',(data) => {
        if(data.balance !== undefined && data.balance.currency !== undefined) {
           currency = data.balance.currency;
           balance_span && balance_span && balance_span.update(data.balance.balance);
        }
    });
    const lng = (local_storage.get('i18n') || {value:'en'}).value;
    const active_symbols = local_storage.get('active_symbols'); 
    /* refresh portfolio when a new contract is added or closed */
    const on_transaction = liveapi.events.on('transaction',(data) => {
        const transaction = data.transaction;
        if(transaction.action === 'buy') {
            const view_button = '<button>View</button>'.i18n();
            const row = [
                transaction.transaction_id,
                transaction.longcode,
                Math.abs(transaction.amount),
                '0.00',
                view_button,
                transaction.contract_id, /* for jq-datatables rowId */
                transaction, /* data for view transaction dailog - when clicking on arrows */
            ];
            transaction.date_expiry && liveapi.sell_expired(transaction.date_expiry)
            table.api().rows.add([row]);
            table.api().draw();
            subscribe_to_contracts([transaction]);
        } else if (transaction.action === 'sell') {
            const tr = table.find('#' + transaction.contract_id)[0];
            table.api().row(tr).remove();
            table.api().draw();
            forget_the_contracts([transaction]);
        }
    });

    liveapi.send({ balance: 1 })
        .then((data) => {
            currency = data.balance.currency;
            portfolioWin = windows.createBlankWindow($('<div/>'), {
                title: 'Portfolio'.i18n(),
                dialogClass: 'portfolio',
                width: 700 ,
                height: 400,
                'data-authorized': 'true',
                close: () => {
                    forget_the_contracts(subscribed_contracts);
                    /* un-register proposal_open_contract handler */
                    liveapi.events.off('proposal_open_contract', update_indicative);
                },
                open: () => {
                    init_table();
                    /* register handler for proposal_open_contract */
                    liveapi.events.on('proposal_open_contract', update_indicative);
                },
                destroy: () => {
                    table && table.DataTable().destroy(true);
                    portfolioWin = null;
                    liveapi.events.off('balance', on_balance);
                    liveapi.events.off('transaction', on_transaction);
                },
                refresh: () => {
                    liveapi.send({ balance: 1 }).catch((err) => { console.error(err); $.growl.error({ message: err.message }); });
                    forget_the_contracts(subscribed_contracts).then(init_table);
                }
            });

            const header = portfolioWin.parent().find('.ui-dialog-title').addClass('with-content');
            balance_span = $('<span class="span-in-dialog-header" />')
                .insertAfter(header);
            balance_span.update = (balance) => {
                balance_span.html('Account balance: <strong>'.i18n() +  formatPrice(balance, currency) + '</strong>');
            };

            table = $("<table width='100%' class='portfolio-dialog hover'/>");
            table.appendTo(portfolioWin);
            table = table.dataTable({
                data: [],
                columns: [
                    { title: 'Ref.'.i18n() },
                    { title: 'Contract Details'.i18n() },
                    {
                        title: 'Purchase'.i18n(),
                        render: (val) => ('<span class="bold">' + formatPrice(val,currency) + '</span>')
                    },
                    {
                        title: 'Indicative'.i18n(),
                        render: (val) => ('<span class="bold">' + formatPrice(val,currency) + '</span>')
                    },
                    { title: '' }
                ],
                rowId : '5', /* jQ datatables support selecting rows based on rowId https://datatables.net/reference/type/row-selector
                                we want not to query rows everytime we update the indicative column */
                paging: false,
                ordering: false,
                processing: true
            });
            table.parent().addClass('hide-search-input');

            portfolioWin.on('click', on_arrow_click);
            portfolioWin.track({
                module_id: 'portfolio',
                is_unique: true,
                data: null
            });
            portfolioWin.dialog('open');
        })
        .catch(
           (err) => console.error(err)
        );
}

const subscribe_to_contracts = (contracts) => {
    contracts.forEach((contract) => {
        subscribed_contracts.push(contract);
        liveapi.proposal_open_contract
            .subscribe(contract.contract_id)
            .catch(
               (err) => console.error({ message: err.message })
            );
    });
}

const forget_the_contracts = (contracts) => {
    const promises = contracts.map((contract) => {
        return liveapi.proposal_open_contract
                .forget(contract.contract_id)
                .catch(
                   (err) => $.growl.error({ message: err.message })
                );
    });
    const ids = _.map(contracts, 'contract_id');
    subscribed_contracts = subscribed_contracts.filter(
      (contract) => (_.includes(ids, contract.contract_id) === false)
    );
    return Promise.all(promises);
}

const init_table = async () => {
    const processing_msg = $('#' + table.attr('id') + '_processing').show();   
    try {
        const data = await liveapi.send({ portfolio: 1 });
        const contracts = (data.portfolio && data.portfolio.contracts);
            //|| [
            //    {
            //        symbol: '', shortcode: '', contract_id: '', longcode: '', expiry_time: 0, currency: '',
            //        date_start: 0, purchase_time: 0, buy_price: '', contract_type: '', payout: ''
            //    }
            //];

        const view_button = '<button>View</button>'.i18n();
        const rows = contracts.map((contract) => {
            return [
                contract.transaction_id,
                contract.longcode,
                contract.buy_price,
                '0.00',
                view_button,
                contract.contract_id, /* for jq-datatables rowId */
                contract, /* data for view transaction dailog - when clicking on arrows */
            ];
        });
        /* register callback to sell contract on expiration */
        contracts.forEach(contract => liveapi.sell_expired(contract.expiry_time));
        subscribe_to_contracts(contracts);

        /* update the table */
        table.api().rows().remove();
        table.api().rows.add(rows);
        table.api().draw();
        processing_msg.hide();
    }
    catch(err) {
        console.error(err);
        table.api().rows().remove();
        table.api().draw();
        processing_msg.hide();
        $.growl.error({ message: err.message });
    }
}

export const proposal_open_contract = {
    subscribe: () => proposalOpenContract('subscribe'),
    forget: () => proposalOpenContract('forget'),
    resubscribe: () => proposalOpenContract('resubscribe')
};

export default { init, proposal_open_contract }; 
