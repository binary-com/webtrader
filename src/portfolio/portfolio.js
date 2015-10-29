/**
 * Created by amin on 10/9/15.
 */

define(['jquery', 'windows/windows', 'websockets/binary_websockets', 'datatables','jquery-growl'], function ($, windows, liveapi) {

    var portfolioWin = null;
    var table = null;

    function init(li) {
        li.click(function () {
            if(!portfolioWin)
                initPortfolioWin();
            else
                portfolioWin.dialog('open');
        });
    }
    function update_indicative(data) {
        var contract = data.proposal_open_contract,
            id = contract.contract_id,
            ask_price = contract.ask_price,
            bid_price = contract.bid_price;
        if (table) {
            console.warn(id + ' => ' + ask_price);
        }
        
    }

    function initPortfolioWin() {
        liveapi.send({ balance: 1 })
            .then(function (data) {
                portfolioWin = windows.createBlankWindow($('<div/>'), { title:'Portfolio', width: 700 });
                var currency = data.balance[0].currency;
                var balance = data.balance[0].balance;
                var header = portfolioWin.parent().find('.ui-dialog-title').css('width', '25%');

                $('<span class="span-in-dialog-header" />')
                    .html('Account balance: <strong>' + currency + ' ' + balance + '</strong>')
                    .insertAfter(header);

                table = $("<table width='100%' class='display compact'/>");
                table.appendTo(portfolioWin);
                table = table.dataTable({
                    data: [],
                    columns: [
                        { title: 'Ref.' },
                        { title: 'Contact Detail' },
                        { title: 'Purchase' },
                        { title: 'Indicative' }
                    ],
                    paging: false,
                    ordering: false,
                    searching: false
                });

                update_table();
                portfolioWin.dialog('open');
            })
            .catch(function (err) {
                console.error(err);
                $.growl.error({ message: err.message });
            });

        /* register handler to update indicative value */
        liveapi.events.on('proposal_open_contract', update_indicative);
    }

    function update_table(){
        liveapi.send({ portfolio: 1 })
            .then(function (data) {
                var contracts = (data.portfolio && data.portfolio.contracts)
                    || [
                        {
                            symbol: '', shortcode: '', contract_id: '', longcode: '', expiry_time: 0, currency: '',
                            date_start: 0, purchase_time: 0, buy_price: '', contract_type: '', payout: ''
                        }
                    ];


                var rows = contracts.map(function (contract) {
                    return [
                        contract.contract_id,
                        contract.longcode,
                        contract.currency + ' ' + contract.buy_price,
                        '-'
                    ];
                });
                
                /* update the table */
                table.api().rows().remove();
                table.api().rows.add(rows);
                table.api().draw();

                /* register to the stream of proposal_open_contract to get indicative values */
                contracts.forEach(function (contract) {
                    liveapi.send({ proposal_open_contract: 1, contract_id: contract.contract_id })
                           .then(update_indicative)
                           .catch(function (err) {
                               console.error(err); // TODO: find a reasonable alternative
                           });
                });
                console.warn(contracts);
            })
            .catch(function (err) {
                console.error(err);
                $.growl.error({ message: err.message });
            });
    }

    return {
        init: init
    }
});
