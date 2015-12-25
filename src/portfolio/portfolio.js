﻿/**
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
                portfolioWin.moveToTop();
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

        if (table) {
            var row = table.api().row('#' + id);
            var cols = row.data();
            var perv_indicative = cols[3];
            cols[3] = indicative; /* update the indicative column */
            row.data(cols);

            /* colorize indicative column on change */
            var span = $('#' + id).find('td:nth-child(4)').find('span');
            span.removeClass('red green').addClass((perv_indicative*1) <= (indicative*1) ? 'green' : 'red');
        }
    }

    function initPortfolioWin() {
        liveapi.send({ balance: 1 })
            .then(function (data) {
                var portfolio_refresh_interval = null;
                portfolioWin = windows.createBlankWindow($('<div/>'), {
                    title: 'Portfolio',
                    width: 700,
                    'data-authorized': 'true',
                    close: function () {
                        portfolio_refresh_interval && clearInterval(portfolio_refresh_interval);
                        portfolio_refresh_interval = null;

                        liveapi.send({ forget_all: 'proposal_open_contract' })
                                .then(function () {
                                    registered_contracts = {};
                                })
                                .catch(function (err) {
                                    console.error(err.message);
                                });
                    },
                    open: function () {
                        /* update table every 1 minute */
                        update_table();
                        portfolio_refresh_interval = setInterval(update_table, 60 * 1000);
                    },
                    destroy: function() {
                      table && table.DataTable().destroy(true);
                      portfolioWin = null;
                      portfolio_refresh_interval && clearInterval(portfolio_refresh_interval);
                      portfolio_refresh_interval = null;
                    }
                });

                var currency = data.balance.currency;
                var balance = data.balance.balance;
                var header = portfolioWin.parent().find('.ui-dialog-title').css('width', '25%');

                $('<span class="span-in-dialog-header" />')
                    .html('Account balance: <strong>' + currency + ' ' + formatPrice(balance) + '</strong>')
                    .insertAfter(header);

                table = $("<table width='100%' class='display compact'/>");
                table.appendTo(portfolioWin);
                table = table.dataTable({
                    data: [],
                    columns: [
                        { title: 'Ref.' },
                        { title: 'Contract Details' },
                        {
                          title: 'Purchase',
                          render: function(val) { return currency + ' ' + '<span class="bold">' + val + '</span>'; }
                        },
                        {
                          title: 'Indicative',
                          render: function(val) { return currency + ' ' + '<span class="bold">' + val + '</span>'; }
                        }
                    ],
                    rowId : '4', /* jQ datatables support selecting rows based on rowId https://datatables.net/reference/type/row-selector
                                    we want not to query rows everytime we update the indicative column */
                    paging: false,
                    ordering: false,
                    processing: true
                });
                table.parent().addClass('hide-search-input');

                var header = portfolioWin.parent().find('.ui-dialog-title');
                var refresh = $("<span class='reload' style='position:absolute; right:85px' title='reload'/>").insertBefore(header);
                refresh.on('click',function(){
                    if(portfolioWin.dialogExtend('state') === 'minimized') {
                        portfolioWin.dialogExtend('restore');
                    }
                    portfolio_refresh_interval && clearInterval(portfolio_refresh_interval);
                    portfolio_refresh_interval = setInterval(update_table, 60 * 1000);
                    update_table();
                });

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
        var processing_msg = $('#' + table.attr('id') + '_processing').show();
        liveapi.send({ portfolio: 1 })
            .then(function (data) {
                var contracts = (data.portfolio && data.portfolio.contracts);
                    //|| [
                    //    {
                    //        symbol: '', shortcode: '', contract_id: '', longcode: '', expiry_time: 0, currency: '',
                    //        date_start: 0, purchase_time: 0, buy_price: '', contract_type: '', payout: ''
                    //    }
                    //];


                var rows = contracts.map(function (contract) {
                    return [
                        contract.transaction_id,
                        contract.longcode,
                        formatPrice(contract.buy_price),
                        '0.00',
                        contract.contract_id, /* for jq-datatables rowId */
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
                                /* show a tooltip on indicative column mouseover */
                                td = $('#' + id).find('td:nth-child(4)');
                                td.attr('title', '').tooltip({ content: err.message });
                                registered_contracts[id] = false;
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
