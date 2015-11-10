/**
 * Created by amin on November 9, 2015.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "datatables", "jquery-growl"], function ($, windows, liveapi) {

    var statement = null,
        table = null;

    function init($menuLink) {
        require(['css!statement/statement.css']);
        require(['text!statement/statement.html']); // Don't wait for liveapi to finish, trigger loading .html file now.
        $menuLink.click(function () {
            if (!statement)
                liveapi.cached.authorize()
                    .then(initStatement)
                    .catch(function (err) {
                        $.growl.error({ message: err.message });
                        console.error(err);
                    });
            else
                statement.dialog('open');
        });
    };

    function initStatement() {
        statement = windows.createBlankWindow($('<div/>'), { title: 'Statement', width: 900 });
        require(['text!statement/statement.html'], function ($html) {

            $html = $($html);
            $html.appendTo(statement);

            table = $html;

            table = table.dataTable({
                data: [],
                "columnDefs": [ {
                    "targets": 4,
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
                    statement: 1,
                    description: 1
                };

                /* if a date is specified get the transactions for that date */
                if (yyyy_mm_dd) {
                    request.date_from = yyyy_mm_dd_to_epoch(yyyy_mm_dd, { utc: true });
                    var one_day_utc = Date.UTC(1970, 0, 1, 23, 59, 59) / 1000;
                    request.date_to = request.date_from + one_day_utc;
                }
                else /* otherwise get the most recent 50 transactions */
                    request.limit = 50;

                /* refresh the table with result of { profit_table:1 } from WS */
                var refresh = function (data) {
                    var transactions = (data.statement && data.statement.transactions) || [];
                    var rows = transactions.map(function (trans) {
                        return [
                            epoch_to_string(trans.transaction_time, { utc: true }),
                            trans.transaction_id,
                            capitalizeFirstLetter(trans.action_type),
                            trans.longcode,
                            (trans.amount * 1).toFixed(2),
                            '<b>' + (trans.balance_after * 1).toFixed(2) + '</b>'
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
            statement.addDateToHeader({
                title: 'Jump to: ',
                date: null, /* set date to null */
                changed: refreshTable,
                cleared: refreshTable
            });

            statement.dialog('open');
        });

    };

    return {
        init: init
    }
});
