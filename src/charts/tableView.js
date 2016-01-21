/**
 * Created by amin january 21, 2016.
 */

define(['jquery', 'moment', 'lokijs', 'charts/chartingRequestMap', 'websockets/stream_handler', 'datatables'],
  function($, moment, loki, chartingRequestMap, stream_handler) {
  var barsTable = chartingRequestMap.barsTable;

  var show_table_view = function(dialog, key){
    var table = dialog.find('.table-view');
    var chart = dialog.find('.chart-view');
    table.animate({left: '0'}, 250);
    chart.animate({left: '-100%'}, 250);
    refresh_table(dialog, key); /* clear table and fill it again */
    dialog.view_table_visible = true; /* let stream_handler new ohlc or ticks update the table */
  }
  var hide_table_view = function(dialog){
    var table = dialog.find('.table-view');
    var chart = dialog.find('.chart-view');
    table.animate({left: '100%'}, 250);
    chart.animate({left: '0'}, 250);
    dialog.view_table_visible = false;
  }

  var refresh_table = function(dialog,key) {
    var table = dialog.find('.table-view');
    var bars = barsTable
                    .chain()
                    .find({instrumentCdAndTp: key})
                    .simplesort('time', true)
                    .data();
    var rows = bars.map(function(bar) {
      return [
        bar.time,
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
  };

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
            { title: 'Date', orderable: false,
              render: function(epoch) { return moment.utc(epoch).format('YYYY-MM-DD HH:mm:ss'); }
            },
            { title: 'Open', orderable: false, },
            { title: 'High', orderable: false, },
            { title: 'Low', orderable: false, },
            { title: 'Close', orderable: false, },
        ],
        rowId : '4',
        paging: false,
        ordering: true,
        info: false,
        order: [0, 'desc'],
        // processing: true
    });
    table.parent().addClass('hide-search-input');

    window.api = table.api();
    var on_tick = stream_handler.events.on('tick', function(data){
      if(data.key !== key) return;
      if(!dialog.view_table_visible) return;
      var tick = data.tick;
      var row = [
        tick.time,
        tick.open,
        tick.high,
        tick.low,
        tick.close
      ];
      table.api().row.add(row);
      table.api().draw();
    });

    var on_ohlc = stream_handler.events.on('ohlc', function(data){
      if(data.key !== key) return;
      if(!dialog.view_table_visible) return;
      var ohlc = data.ohlc;
      var row = [
        ohlc.time,
        ohlc.open,
        ohlc.high,
        ohlc.low,
        ohlc.close
      ];
      if(data.is_new) { table.api().row.add(row); }
      else { table.api().row(0).data(row); }
      table.api().draw();
    });

    dialog.on('dialogdestroy', function(){
      stream_handler.events.off('tick', on_tick);
      stream_handler.events.off('ohld', on_ohlc);
    });

    return {
        show: show_table_view.bind(null, dialog, key),
        hide: hide_table_view.bind(null, dialog)
    }
  }

  return { init: init }
});
