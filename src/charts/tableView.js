/**
 * Created by amin january 21, 2016.
 */

define(['jquery', 'moment', 'datatables' ], function($, moment) {

  var show_table_view = function(dialog){
    var table = dialog.find('.table-view');
    var chart = dialog.find('.chart-view');
    table.animate({left: '0'}, 250);
    chart.animate({left: '-100%'}, 250);
  }
  var hide_table_view = function(dialog){
    var table = dialog.find('.table-view');
    var chart = dialog.find('.chart-view');
    table.animate({left: '100%'}, 250);
    chart.animate({left: '0'}, 250);
  }

  function init(dialog){
    var container = dialog.find('.table-view');
    var close = container.find('span.close');
    close.on('click', hide_table_view.bind(null, dialog)); /* hide the dialog on close icon click */

    var table = $("<table width='100%' class='portfolio-dialog display compact'/>");
    table.appendTo(container);
    table = table.dataTable({
        data: [],
        columns: [
            { title: 'Date',
              render: function(val) { return val + ' formatted' }
            },
            { title: 'Open' },
            { title: 'High' },
            { title: 'Low' },
            { title: 'Close' },
        ],
        rowId : '4',
        paging: false,
        ordering: false,
        info: false,
        // processing: true
    });
    table.parent().addClass('hide-search-input');
  }

  return {
    init: init,
    show: show_table_view,
    hide: hide_table_view
  }
});
