/**
 * Created by amin on October 29, 2015.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "lodash", "datatables", "jquery-growl", 'common/util'],
    function ($, windows, liveapi, _) {
    'use strict';

    var profitWin = null,
        table = null,
        datepicker = null;

    function init($menuLink) {
        require(["css!profittable/profitTable.css"]);
        require(['text!profittable/profitTable.html']); // Don't wait for liveapi to finish, trigger loading .html file now.
        $menuLink.click(function () {
            if (!profitWin)
                liveapi.cached.authorize()
                    .then(initProfitWin)
                    .catch(function (err) {
                        console.error(err);
                        $.growl.error({ message: err.message });
                    });
            else
                profitWin.moveToTop();
        });
    }

    var loading = false;
    var options = { offset : 0, limit: 200 };
    var is_specific_date_shown = false; /* is data for a specific date is shown */

    var refreshTable = function (yyyy_mm_dd) {
        var processing_msg = $('#' + table.attr('id') + '_processing').css('top','200px').show();
        loading = true;

        var request = {
            profit_table: 1,
            description: 1,
            sort: 'DESC'
        };

        /* if a date is specified get the transactions for that date */
        if (typeof yyyy_mm_dd === 'string') {
            request.date_from = yyyy_mm_dd_to_epoch(yyyy_mm_dd, { utc: true });
            var one_day_utc = Date.UTC(1970, 0, 1, 23, 59, 59) / 1000;
            request.date_to = request.date_from + one_day_utc;
            table.api().rows().remove();
            is_specific_date_shown = true;
        }
        else  { /* request the next 50 items for live scroll */
            request.limit = 50;
            if(is_specific_date_shown || yyyy_mm_dd.clear) {
                table.api().rows().remove();
                is_specific_date_shown = false;
            }
            request.offset = table.api().column(0).data().length;
        }

        /* refresh the table with result of { profit_table:1 } from WS */
        var refresh = function (data) {
            var transactions = (data.profit_table && data.profit_table.transactions) || [];
            var rows = transactions.map(function (trans) {
                var profit = (parseFloat(trans.sell_price) - parseFloat(trans.buy_price)).toFixed(2); /* 2 decimal points */
                var svg = profit > 0 ? 'up' : profit < 0 ? 'down' : 'equal';
                var img = '<img class="arrow" src="images/' + svg + '-arrow.svg"/>';
                return [
                    epoch_to_string(trans.purchase_time, { utc: true }),
                    trans.transaction_id,
                    img + trans.longcode,
                    trans.buy_price,
                    epoch_to_string(trans.sell_time, { utc: true }),
                    trans.sell_price,
                    profit,
                    trans, /* we will use it when handling arrow clicks to show view transaction dialog */
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

    var on_arrow_click = function(e){
      if(e.target.tagName !== 'IMG')
        return;
      var tr = e.target.parentElement.parentElement;
      var transaction = table.api().row(tr).data();
      transaction = _.last(transaction);
      require(['viewtransaction/viewTransaction'], function(viewTransaction){
        viewTransaction.init(transaction.contract_id, transaction.transaction_id);
      });
    }

    function initProfitWin() {
        require(['text!profittable/profitTable.html'], function (html) {
          profitWin = windows.createBlankWindow($('<div/>'), {
              title: 'Profit Table',
              width: 700,
              minHeight:90,
              destroy: function() { table && table.DataTable().destroy(true); profitWin = null; },
              refresh: function() {
                datepicker.clear();
                refreshTable({clear:true});
              },
              'data-authorized': 'true'
          });

            table = $(html);
            table.appendTo(profitWin);
            var footer = $('<div/>').addClass('profit-table-info');

            table = table.dataTable({
                data: [],
                columnDefs: [ {
                    targets: 6,
                    createdCell: function (td, cellData) {
                        var css_class = (cellData < 0) ? 'red' : (cellData > 0) ? 'green' : 'bold';
                        if (css_class)
                            $(td).addClass(css_class);
                    }
                }],
                info: false,
                footerCallback: function ( row, data, start, end, display ) {
                  var api = this.api(), data;

                  var total = api.column(6).data()
                    .reduce(function(a, b) { return a*1 + b*1; }, 0);

                  var css = 'total ' + (total >= 0 ? 'green' : 'red');
                  footer.html(
                    '<span class="title">Total Profit/Loss<span>' +
                    '<span class="' + css + '">'+ formatPrice(total) +'</span>'
                  );
                },
                paging: false,
                ordering: false,
                searching: true,
                processing: true
            });
            footer.appendTo(table.parent());
            table.parent().addClass('hide-search-input');

            // Apply the a search on each column input change
            table.api().columns().every(function () {
                var column = this;
                $('input', this.header()).on('keyup change', function () {
                    if (column.search() !== this.value)
                        column.search(this.value) .draw();
                });
            });

            refreshTable({clear: true});
            datepicker = profitWin.addDateToHeader({
                title: 'Jump to: ',
                date: null, /* set date to null */
                changed: refreshTable,
                cleared: refreshTable
            });

            profitWin.dialog('open');
            profitWin.on('click', on_arrow_click);

            /**************** infinite scroll implementation *******************/
            profitWin.scroll(function() {
              var scrollTop = profitWin.scrollTop(),
                  innerHeight = profitWin.innerHeight(),
                  scrollHeight = profitWin[0].scrollHeight,
                  postion = (scrollTop + innerHeight) / scrollHeight;
              if(postion > 0.75 && !loading && !is_specific_date_shown){
                refreshTable({clear:false});
              }
            });
        });
    }

    return {
        init: init
    }
});
