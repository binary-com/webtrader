/**
 * Created by amin on November 9, 2015.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "datatables", "jquery-growl"], function ($, windows, liveapi) {

    var statement = null,
        table = null,
        datepicker = null;

    function init($menuLink) {
        require(['css!statement/statement.css']);
        require(['text!statement/statement.html']); // Don't wait for liveapi to finish, trigger loading .html file now.
        $menuLink.click(function () {
            if (!statement)
                liveapi.cached.authorize()
                    .then(initStatement)
                    .catch(function (err) {
                        console.error(err);
                    });
            else
                statement.moveToTop();
        });
    };

    var loading = false;
    var options = { offset : 0, limit: 50 };
    var is_specific_date_shown = false; /* is data for a specific date is shown */

    function refreshTable (yyy_mm_dd) {
        var processing_msg = $('#' + table.attr('id') + '_processing').css('top','200px').show();
        loading = true;

        var request = {
            statement: 1,
            description: 1
        };

        /* if a date is specified get the transactions for that date */
        if (typeof yyy_mm_dd === 'string') {
            request.date_from = yyyy_mm_dd_to_epoch(yyy_mm_dd, { utc: true });
            var one_day_utc = Date.UTC(1970, 0, 1, 23, 59, 59) / 1000;
            request.date_to = request.date_from + one_day_utc;
            table.api().rows().remove();
            is_specific_date_shown = true;
        }
        else  { /* request the next 50 items for live scroll */
            request.limit = 50;
            if(is_specific_date_shown || yyy_mm_dd.clear) {
                table.api().rows().remove();
                is_specific_date_shown = false;
            }
            request.offset = table.api().column(0).data().length;
        }

        /* refresh the table with result of { profit_table:1 } from WS */
        var refresh = function (data) {
            var transactions = (data.statement && data.statement.transactions) || [];
            var rows = transactions.map(function (trans) {
                var amount = trans.amount * 1;
                var svg = amount > 0 ? 'up' : amount < 0 ? 'down' : 'equal';
                var img = '<img class="arrow" src="images/' + svg + '-arrow.svg"/>';
                return [
                    epoch_to_string(trans.transaction_time, { utc: true }),
                    trans.transaction_id,
                    capitalizeFirstLetter(trans.action_type),
                     img + trans.longcode ,
                    (trans.amount * 1).toFixed(2),
                    '<b>' + formatPrice(trans.balance_after) + '</b>'
                ];
            });
            table.api().rows.add(rows);
            table.api().draw();
            loading = false;
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

    function initStatement() {
        statement = windows.createBlankWindow($('<div/>'), {
            title: 'Statement',
            width: 900 ,
            minHeight:100,
            destroy: function() { table && table.DataTable().destroy(true); statement = null; },
            refresh: function() {
              datepicker.clear();
              refreshTable({clear:true});
            },
            'data-authorized' :'true'
        });
        require(['text!statement/statement.html'], function (html) {

            table = $(html);
            table.appendTo(statement);

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
                processing: true,
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


            datepicker = statement.addDateToHeader({
                title: 'Jump to: ',
                date: null, /* set date to null */
                changed: refreshTable,
                cleared: refreshTable
            });

            statement.dialog('open');


            /**************** infinite scroll implementation *******************/
            refreshTable({clear:true});
            statement.scroll(function(){
              var scrollTop = statement.scrollTop(),
                  innerHeight = statement.innerHeight(),
                  scrollHeight = statement[0].scrollHeight,
                  postion = (scrollTop + innerHeight) / scrollHeight;
              if(postion > 0.75 && !loading && !is_specific_date_shown){
                refreshTable({clear:false});
              }
            });
        });

    };

    return {
        init: init
    }
});
