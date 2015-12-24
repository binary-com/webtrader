/**
 * Created by amin on October 29, 2015.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "datatables", "jquery-growl", 'common/util'],
    function ($, windows, liveapi) {
    'use strict';

    var profitWin = null,
        table = null;

    function init($menuLink) {
        require(["css!profittable/profitTable.css"]);
        require(['text!profittable/profitTable.html']); // Don't wait for liveapi to finish, trigger loading .html file now.
        $menuLink.click(function () {
            if (!profitWin)
                liveapi.cached.authorize()
                    .then(initProfitWin)
                    .catch(function (err) {
                        $.growl.error({ message: err.message });
                        console.error(err);
                    });
            else
                profitWin.moveToTop();
        });
    }

    function initProfitWin() {
        profitWin = windows.createBlankWindow($('<div/>'), {
            title: 'Profit Table',
            width: 900,
            destroy: function() { table && table.DataTable().destroy(true); profitWin = null; },
            'data-authorized': 'true'
        });
        require(['text!profittable/profitTable.html'], function ($html) {

            $html = $($html);
            $html.appendTo(profitWin);

            table = $html;

            table = table.dataTable({
                data: [],
                "columnDefs": [ {
                    "targets": 6,
                    "createdCell": function (td, cellData) {
                        var css_class = (cellData < 0) ? 'red' : (cellData > 0) ? 'green' : 'bold';
                        if (css_class)
                            $(td).addClass(css_class);
                    }
                }],
                paging: false,
                ordering: false,
                searching: true,
                processing: true
            });
            table.parent().addClass('hide-search-input');

            // Apply the a search on each column input change
            table.api().columns().every(function () {
                var column = this;
                $('input', this.header()).on('keyup change', function () {
                    if (column.search() !== this.value)
                        column.search(this.value) .draw();
                });
            });

            var refreshTable = function (yyyy_mm_dd) {
                var processing_msg = $('#' + table.attr('id') + '_processing').css('top','200px').show();

                var request = {
                    profit_table: 1,
                    description: 1,
                    sort: 'DESC'
                };

                /* if a date is specified get the transactions for that date */
                if (yyyy_mm_dd)
                    request.date_from = request.date_to = yyyy_mm_dd;
                else /* otherwise get the most recent 50 transactions */
                    request.limit = 50;

                /* refresh the table with result of { profit_table:1 } from WS */
                var refresh = function (data) {
                    var transactions = (data.profit_table && data.profit_table.transactions) || [];
                    var rows = transactions.map(function (trans) {
                        return [
                            epoch_to_string(trans.purchase_time, { utc: true }),
                            trans.transaction_id,
                            trans.longcode,
                            trans.buy_price,
                            epoch_to_string(trans.sell_time, { utc: true }),
                            trans.sell_price,
                            (parseFloat(trans.buy_price) - parseFloat(trans.sell_price)).toFixed(2) /* 2 decimal points */
                        ];
                    });
                    table.api().rows().remove();
                    table.api().rows.add(rows);
                    table.api().draw();
                    processing_msg.hide();
                };

                liveapi.send(request)
                .then(refresh)
                .catch(function (err) {
                    refresh({});
                    $.growl.error({ message: err.message });
                    console.error(err);
                });
            }

            refreshTable();
            profitWin.addDateToHeader({
                title: 'Jump to: ',
                date: null, /* set date to null */
                changed: refreshTable,
                cleared: refreshTable
            });

            profitWin.dialog('open');
        });
    }

    return {
        init: init
    }
});
