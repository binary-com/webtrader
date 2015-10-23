/**
 * Created by amin on 10/9/15.
 */

define(['jquery', 'windows/windows', 'websockets/eventSourceHandler', 'datatables','jquery-growl'], function ($, windows, liveapi) {

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

    function initPortfolioWin() {
        $.growl.notice({ message: 'Loading Portfolio ...' });
        liveapi.authenticated.send({ balance: 1 })
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
                $.growl.error({ message: err.message });
            });
    }

    function update_table(){
        liveapi.authenticated.send({ portfolio: 1 })
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
                        contract.currency + ' ' + contract.payout /* TODO: fix this */
                    ]
                });
                
                /* update the table */
                table.api().rows().remove();
                table.api().rows.add(rows);
                table.api().draw();

                console.warn(contracts);
            })
            .catch(function (err) {
                $.growl.error({ message: err.message });
            });
    }

    return {
        init: init
    }
});
