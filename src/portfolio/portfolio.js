/**
 * Created by amin on 10/9/15.
 */

define(['jquery', 'windows/windows', 'websockets/binary_websockets','jquery-ui', 'datatables','jquery-growl'], function ($, windows, liveapi) {

    var portfolioWin = null;
    var table = null;
    var registered_contracts = {};

    function init(li) {
        li.click(function () {
            if(!portfolioWin)
                initPortfolioWin();
            else
                portfolioWin.dialog('open');
        });
    }
    function update_indicative(data) {
        var contract = data.proposal_open_contract;
        var id = contract.contract_id,
            indicative = contract.ask_price,
            bid_price = contract.bid_price;
        if (!id) {

            return;
        }

        if (table)
        {
            var row = table.api().row('#' + id);
            var cols = row.data();
            var perv_indicative = cols[3];
            cols[3] = indicative; /* update the indicative column */
            row.data(cols);

            /* colorize indicative column on change */
            var td = $('#' + id).find('td:nth-child(4)');
            td.removeClass('red green').addClass((perv_indicative*1) <= (indicative*1) ? 'green' : 'red');
        }
    }

    function initPortfolioWin() {
        liveapi.send({ balance: 1 })
            .then(function (data) {
                portfolioWin = windows.createBlankWindow($('<div/>'), { title:'Portfolio', width: 700 });
                var currency = data.balance.currency;
                var balance = data.balance.balance;
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
                    rowId : '0', /* jQ datatables support selecting rows based on rowId https://datatables.net/reference/type/row-selector
                                    we want not to query rows everytime we update the indicative column */
                    paging: false,
                    ordering: false,
                    processing: true
                });
                table.parent().addClass('hide-search-input');

                portfolioWin.dialog('open');

                /* update table every 1 minute */
                update_table();
                setInterval(update_table, 60 * 1000); // TODO: ask arnab if needs to removeInterval(...) on window close.
            })
            .catch(function (err) {
                console.error(err);
                $.growl.error({ message: err.message });
            });

        /* register handler to update indicative value */
        liveapi.events.on('proposal_open_contract', update_indicative);
    }

    function update_table(){
        var processing_msg = $('#' + table.attr('id') + '_processing').show();
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
                processing_msg.hide();

                var register = function (contract) {
                    var id = contract.contract_id;
                    if (registered_contracts[id] !== true) {
                        registered_contracts[id] = true;
                        liveapi.send({ proposal_open_contract: 1, contract_id: id })
                            .catch(function (err) {
                                console.error(err);

                                /* show a tooltip on indicative column mouseover */
                                td = $('#' + id).find('td:nth-child(4)');
                                td.attr('title', '').tooltip({ content: err.message });
                            });
                    }
                }
                /* register to the stream of proposal_open_contract to get indicative values */
                contracts.forEach(register);
            })
            .catch(function (err) {
                console.error(err);
                table.api().rows().remove();
                table.api().draw();
                processing_msg.hide();
                $.growl.error({ message: err.message });
            });
    }

    return {
        init: init
    }
});
