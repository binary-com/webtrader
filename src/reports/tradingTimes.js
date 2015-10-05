/**
 * Created by amin on 10/5/15.
 */
define(["jquery", "datatables"], function ($) {
    loadCSS("//cdn.datatables.net/1.10.5/css/jquery.dataTables.min.css");

    function init(tradingWin) {
        var table = $("<table width='100%' class='display' cellspacing='0'/>");
        table.appendTo(tradingWin.find('.chartSubContainer'));

        table.DataTable({
            data: [],
            columns: [
                {title: 'Asset'},
                {title: 'Opens'},
                {title: 'Closes'},
                {title: 'Settles'},
                {title: 'Upcoming Events'}
            ],
            paging: false,
            searching: false
        });
    }
   
    return {
        init: init
    }
});
