/**
 * Created by amin on October 29, 2015.
 */
define(["jquery", "windows/windows", "websockets/binary_websockets", "datatables", "jquery-growl"], function ($, windows, liveapi) {
    function init($menuLink) {
        loadCSS("profittable/profitTable.css");
        $menuLink.click(function () {
            if (!profitWin) {
                profitWin = windows.createBlankWindow($('<div/>'), { title: 'Profit Table', width: 700 });
                $.get('profittable/profitTable.html', initProfitWin);
            }
            profitWin.dialog('open');
        });
    }

    function initTradingWin($html) {
        console.warn($html);
        //$html = $($html);
        //var subheader = $html.filter('.trading-times-sub-header');
        //table = $html.filter('table');
        //$html.appendTo(tradingWin);

        //table = table.dataTable({
        //    data: [],
        //    "columnDefs": [
        //        { className: "dt-body-center dt-header-center", "targets": [ 0,1,2,3,4 ] }
        //    ],
        //    paging: false,
        //    ordering: false,
        //    searching: true,
        //    processing: true
        //});
        //table.parent().addClass('hide-search-input');

        //// Apply the a search on each column input change
        //table.api().columns().every(function () {
        //    var column = this;
        //    $('input', this.header()).on('keyup change', function () {
        //        if (column.search() !== this.value)
        //            column.search(this.value) .draw();
        //    });
        //});

        //var market_names = null,
        //    submarket_names = null;

        //var refreshTable = function (yyyy_mm_dd) {
        //    var processing_msg = $('#' + table.attr('id') + '_processing').show();

        //    /* update the table with the given marketname and submarketname */
        //    var updateTable = function(result, market_name,submarket_name){
        //        var rows = result.getRowsFor(market_name, submarket_name);
        //        table.api().rows().remove();
        //        table.api().rows.add(rows);
        //        table.api().draw();
        //    }

        //    /* refresh the table with result of {trading_times:yyyy_mm_dd} from WS */
        //    var refresh = function (data) {
        //        var result = processData(data);

        //        if (market_names == null) {
        //            var select = $('<select />');
        //            select.appendTo(subheader);
        //            market_names = windows.makeSelectmenu(select, {
        //                list: result.market_names,
        //                inx: 0,
        //                changed: function (val) {
        //                    submarket_names.update_list(result.submarket_names[val]);
        //                    updateTable(result, market_names.val(), submarket_names.val());
        //                }
        //            });
        //        }

        //        if (submarket_names == null) {
        //            var sub_select = $('<select />');
        //            sub_select.appendTo(subheader);
        //            submarket_names = windows.makeSelectmenu(sub_select, {
        //                list: result.submarket_names[market_names.val()],
        //                inx: 0,
        //                changed: function (val) {
        //                    updateTable(result, market_names.val(), submarket_names.val());
        //                }
        //            });
        //        }

        //        updateTable(result, market_names.val(), submarket_names.val());
        //        processing_msg.hide();
        //    };
            
        //    liveapi.send({ trading_times: yyyy_mm_dd })
        //    .then(refresh)
        //    .catch(function (error) {
        //        refresh({});
        //        $.growl.error({ message: error.message });
        //        console.warn(error);
        //    });
        //}

        //refreshTable(new Date().toISOString().slice(0, 10));
        //tradingWin.addDateToHeader({
        //    title: 'Date: ',
        //    date: new Date(),
        //    changed: refreshTable
        //});
    }
});
