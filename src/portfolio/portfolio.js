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
                portfolioWin.dialog('open');
            })
            .catch(function (err) {
                $.growl.error({ message: err.message });
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
