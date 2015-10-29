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
                profitWin = windows.createBlankWindow($('<div/>'), { title: 'Profit Table', width: 1200 });
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
            "columnDefs": [
                { className: "dt-body-center dt-header-center", "targets": [ 0,1,2,3,4,5,6 ] }
            ],
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
                var rows = transactions.map(function (trans) {
                    return [
                        '', '', '', '', '', '', ''
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
