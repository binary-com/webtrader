/**
 * Created by amin on 10/9/15.
 */

define(['jquery', 'windows/windows', 'websockets/eventSourceHandler'], function ($, windows, liveapi) {
    

    var token = 'RXjoDNVaVmLWHLB1aJnd4BYqnwpWkI16Tevm4faumvsAbsD0'; /*TODO: remove hardcoded api token! */
    var portfolioWin = null;
    var table = null;

    function init(li) {
        portfolioWin = windows.createBlankWindow($('<div/>'), { title:'Portfolio', width: 700 });
        initPortfolioWin();
        li.click(function () { portfolioWin.dialog('open'); });
        setTimeout(function () {
            portfolioWin.dialog('open'); // DEBUG: only for debug
        }, 2000);
    }

    function initPortfolioWin() {
        require(["jquery", "jquery-growl"], function($) {
            liveapi.send({ authorize: token })
                .then(function (data) {
                    var currency = data.authorize.currency;
                    var balance = data.authorize.balance;
                    var header = portfolioWin.parent().find('.ui-dialog-title').css('width', '25%');

                    $('<span class="span-in-dialog-header" />')
                        .html('Account balance: <strong>' + currency + ' ' + balance + '</strong>')
                        .insertAfter(header);

                    table = $("<table width='100%' class='display compact'/>");
                    table.appendTo(portfolioWin);
                    table = table.DataTable({
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

                })
                .catch(function () {
                    $.growl.error({ message: data.error.message });
                });
        });
    }

    function update_table(){
        liveapi.send({ portfolio: 1 }).then(function (data) {
            var contracts = (data.portfolio && data.portfolio.contracts) || [];
            console.warn('ret:' + JSON.stringify(data));
        });
    }

    return {
        init: init
    }
});
