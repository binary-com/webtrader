/**
 * Created by amin on November 9, 2015.
 */
define(['module', "jquery", "windows/windows", "websockets/binary_websockets", "lodash", "datatables", "jquery-growl"], function (module, $, windows, liveapi, _) {

    var statement = null,
        table = null,
        datepicker = null,
        currency=local_storage.get("currency");

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
    var options = { offset : 0, limit: 200 };
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
            var view_button = '<button>View</button>'.i18n();
            var rows = transactions.map(function (trans) {
                var amount = trans.amount * 1;
                return [
                    epoch_to_string(trans.transaction_time, { utc: true }),
                    trans.transaction_id,
                    _.capitalize(trans.action_type),
                     trans.longcode ,
                    (trans.amount * 1).toFixed(2),
                    '<b>' + formatPrice(trans.balance_after,currency) + '</b>',
                    view_button,
                    trans, /* data for view transaction dailog - when clicking on arrows */
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
            title: 'Statement'.i18n(),
            width: 700 ,
            height: 400,
            destroy: function() { table && table.DataTable().destroy(true); statement = null; },
            refresh: function() {
              datepicker.clear();
              refreshTable({clear:true});
            },
            'data-authorized' :'true'
        });
        statement.track({
          module_id: 'statement',
          is_unique: true,
          data: null,
        });
        require(['text!statement/statement.html'], function (html) {

            table = $(html).i18n();
            table.appendTo(statement);

            table = table.dataTable({
                data: [],
                "columnDefs": [ {
                    "targets": 4,
                    "createdCell": function (td, cellData) {
                        var css_class = (cellData < 0) ? 'red' : (cellData > 0) ? 'green' : 'bold';
                        if (css_class)
                            $(td).addClass(css_class);
                        td.textContent = formatPrice(cellData, currency);
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

            statement.on('click', on_arrow_click);
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

    var on_arrow_click = function(e){
      var target = e.target;
      var $target = $(target);
      if(target.tagName !== 'BUTTON' || $target.hasClass('button-disabled'))
        return;
      var tr = target.parentElement.parentElement;
      var transaction = table.api().row(tr).data();
      transaction = _.last(transaction);
      $target.addClass('button-disabled');
      require(['viewtransaction/viewTransaction'], function(viewTransaction){
        viewTransaction.init(transaction.contract_id, transaction.transaction_id)
                       .then(function(){ $target.removeClass('button-disabled'); });
      });
    }

    return {
        init: init
    }
});
