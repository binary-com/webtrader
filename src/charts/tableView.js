/**
 * Created by amin january 21, 2016.
 */

define(['jquery', 'moment', 'lokijs', 'charts/chartingRequestMap', 'datatables'], function($, moment, loki, chartingRequestMap) {
  var barsTable = chartingRequestMap.barsTable;

  var show_table_view = function(dialog, key){
    var table = dialog.find('.table-view');
    var chart = dialog.find('.chart-view');
    table.animate({left: '0'}, 250);
    chart.animate({left: '-100%'}, 250);

    var bars = barsTable
                    .chain()
                    .find({instrumentCdAndTp: key})
                    .simplesort('time', false)
                    .data();
    var rows = bars.map(function(bar) {
      return [
        moment.utc(bar.time).format('YYYY-MM-DD HH:mm:ss'),
        bar.open,
        bar.high,
        bar.low,
        bar.close
      ];
    });
    var api = table.find('table').DataTable();
    api.rows().remove();
    api.rows.add(rows);
    api.draw();
  }
  var hide_table_view = function(dialog){
    var table = dialog.find('.table-view');
    var chart = dialog.find('.chart-view');
    table.animate({left: '100%'}, 250);
    chart.animate({left: '0'}, 250);
  }

  function init(dialog){
    var container = dialog.find('.table-view');
    var data = dialog.find('#' + dialog.attr('id') + '_chart').data();
    var key = chartingRequestMap.keyFor(data.instrumentCode, data.timePeriod);
    var close = container.find('span.close');
    close.on('click', hide_table_view.bind(null, dialog)); /* hide the dialog on close icon click */

    var table = $("<table width='100%' class='portfolio-dialog display compact'/>");
    table.appendTo(container);
    table = table.dataTable({
        data: [],
        columns: [
            { title: 'Date' },
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

    return {
        show: show_table_view.bind(null, dialog, key),
        hide: hide_table_view.bind(null, dialog, key)
    }
  }

  return { init: init }
});
