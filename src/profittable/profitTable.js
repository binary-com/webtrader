/**
 * Created by amin on October 29, 2015.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "datatables", "jquery-growl"], function ($, windows, liveapi) {
    'use strict';

    var profitWin = null,
        table = null;

    function init($menuLink) {
        loadCSS("profittable/profitTable.css");
        $menuLink.click(function () {
            if (!profitWin)
                liveapi.cached.authorize()
                    .then(initProfitWin)
                    .catch(function (err) {
                        $.growl.error({ message: err.message });
                        console.error(err);
                    });
            else
                profitWin.dialog('open');
        });
    }

    function initProfitWin($html) {
        profitWin = windows.createBlankWindow($('<div/>'), { title: 'Profit Table', width: 900 });
        $.get('profittable/profitTable.html', function ($html) {

            $html = $($html);
            $html.appendTo(profitWin);

            table = $html;

            table = table.dataTable({
                data: [],
                "columnDefs": [ {
                    "targets": 6,
                    "createdCell": function (td, cellData) {
                        var css_class = (cellData < 0) ? 'red' : (cellData > 0) ? 'green' : '';
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
                var processing_msg = $('#' + table.attr('id') + '_processing').show();

                var request = {
                    profit_table: 1,
                    description: 1,
                    sort: 'DESC'
                };

                /* if a date is specified get the transactions for that date */
                if (yyyy_mm_dd)
                    request.date_from = request.date_to = yyyy_mm_dd;
                else /* otherwise get the most recent 10 transactions */
                    request.limit = 10;

                /* refresh the table with result of { profit_table:1 } from WS */
                var refresh = function (data) {
                    var transactions = (data.profit_table && data.profit_table.transactions) || [];
                    var date_to_string = function (epoch) {
                        var d = new Date(epoch * 1000); /* since unixEpoch is simply epoch / 1000, we  multiply the argument by 1000 */
                        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' +
                        d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
                    };
                    var rows = transactions.map(function (trans) {
                        return [
                            date_to_string(trans.purchase_time),
                            trans.contract_id,
                            trans.longcode,
                            trans.buy_price,
                            date_to_string(trans.sell_time),
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
                changed: refreshTable
            });

            profitWin.dialog('open');
        });
    }

    return {
        init: init
    }
});
