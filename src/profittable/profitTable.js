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
            if (!profitWin) {
                profitWin = windows.createBlankWindow($('<div/>'), { title: 'Profit Table', width: 800 });
                $.get('profittable/profitTable.html', initProfitWin);
            }
            profitWin.dialog('open');
        });
    }

    function initProfitWin($html) {
        $html = $($html);
        $html.appendTo(profitWin);

        table = $html;

        table = table.dataTable({
            data: [],
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


            /* refresh the table with result of { profit_table:1 } from WS */
            var refresh = function (data) {
                var transactions = (data.profit_table && data.profit_table.transactions) || [];
                console.warn(transactions);
                var date_to_string = function (epoch) {
                    var d = new Date(epoch);
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
                        parseFloat(trans.buy_price) - parseFloat(trans.sell_price)
                    ]
                });
                table.api().rows().remove();
                table.api().rows.add(rows);
                table.api().draw();
                processing_msg.hide();
            };
            
            liveapi.send({ profit_table: 1, description: 1 })
            .then(refresh)
            .catch(function (err) {
                refresh({});
                $.growl.error({ message: err.message });
                console.error(err);
            });
        }

        refreshTable(new Date().toISOString().slice(0, 10));
        profitWin.addDateToHeader({
            title: 'Jump to: ',
            date: new Date(),
            changed: refreshTable
        });
    }

    return {
        init: init
    }
});
