/**
 * Created by amin january 21, 2016.
 */

define(['jquery', 'moment', 'lokijs', 'charts/chartingRequestMap', 'websockets/stream_handler', 'datatables'],
  function($, moment, loki, chartingRequestMap, stream_handler) {
  var barsTable = chartingRequestMap.barsTable;
  var dialogOldWidth;

  var show_table_view = function(dialog, key){
    var table = dialog.find('.table-view');
    var chart = dialog.find('.chart-view');
    $('span.close').css('display', 'block');
    table.animate({left: '0'}, 250);
    chart.animate({left: '-100%'}, 250);
    refresh_table(dialog, key); /* clear table and fill it again */
    dialogOldWidth = dialog.parent().width();
    var data = dialog.find('#' + dialog.attr('id') + '_chart').data();
    var width = isTick(data.timePeriod) ? 500 : 700;
    if (dialogOldWidth < width) {
        dialog.parent().width(width);
        dialog.width('100%');
    };
    //Adjust table column size
    var tbl = table.find('table').DataTable();
    tbl.columns.adjust().draw();
    dialog.view_table_visible = true; /* let stream_handler new ohlc or ticks update the table */
  }
  var hide_table_view = function(dialog){
    var table = dialog.find('.table-view');
    var chart = dialog.find('.chart-view');
    $('span.close').css('display', 'none');
    table.animate({left: '100%'}, 250);
    chart.animate({ left: '0' }, 250);
    dialog.view_table_visible = false;
    //Return dialog size to old size
    if (dialog.parent().width() !== dialogOldWidth) {
        dialog.parent().width(dialogOldWidth);
        dialog.width('100%');
        var $chartSubContainer = dialog.find(".chartSubContainer");
        $chartSubContainer.width(dialog.width() - 10);
        $chartSubContainer.height(dialog.height() - 15);
        var containerIDWithHash = "#" + $chartSubContainer.attr("id");
        require(["charts/charts"], function (charts) {
            charts.triggerReflow(containerIDWithHash);
        });
    };
  }

  var refresh_table = function(dialog,key) {
    var data = dialog.find('#' + dialog.attr('id') + '_chart').data();
    var is_tick = isTick(data.timePeriod);
    var table = dialog.find('.table-view');
    var bars = barsTable
                    .chain()
                    .find({instrumentCdAndTp: key})
                    .simplesort('time', true)
                    .data();
    var index = 0;
    var rows = bars.map(function (bar) {
      //The bars list has been sotrted by time ,The previous value is in next index
      var preBar = index == bars.length - 1 ? bars[index] : bars[index + 1];
      index++;
      if(is_tick) {
        var diff = calculatePercentageDiff(preBar.open, bar.open);
        return [bar.time, bar.open, diff.value, diff.image];
      }
      var diff = calculatePercentageDiff(preBar.close, bar.close);
      return [
        bar.time,
        bar.open,
        bar.high,
        bar.low,
        bar.close,
        diff.value,
        diff.image
      ];
    });
    var api = table.find('table').DataTable();
    api.rows().remove();
    api.rows.add(rows);
    api.draw();
  };

  var calculatePercentageDiff = function (firstNumber, secondNumber) {
      /*Calculation = ( | V1 - V2 | / |V1| )* 100 */
      var diff = toFixed(Math.abs(firstNumber - secondNumber), 4);
      var Percentage_diff = toFixed((Math.abs(firstNumber - secondNumber) / Math.abs(firstNumber)) * 100, 2);
      if (firstNumber <= secondNumber)
          return {
              value: diff + '(' + Percentage_diff + '%)',
              image: diff === 0 ? '' : '<img src="images/green_up_arrow.svg" class="arrow-images"/>'
          };
      else
          return {
              value: '<span style="color:brown">' + diff + '(' + Percentage_diff + '%) </span>',
              image: diff === 0 ? '' : '<img src="images/red_down_arrow.svg" class="arrow-images"/>'
          };
  };

  function init(dialog){
    var container = dialog.find('.table-view');
    var data = dialog.find('#' + dialog.attr('id') + '_chart').data();
    var is_tick = isTick(data.timePeriod);
    var key = chartingRequestMap.keyFor(data.instrumentCode, data.timePeriod);
    var close = dialog.find('span.close');
    close.on('click', hide_table_view.bind(null, dialog)); /* hide the dialog on close icon click */

    var table = $("<table width='100%' class='portfolio-dialog display compact'/>");
    table.appendTo(container);
    var columns = [
          { title: 'Date', orderable: false,
            render: function(epoch) { return moment.utc(epoch).format('YYYY-MM-DD HH:mm:ss'); }
          },
          { title: 'Open', orderable: false, },
          { title: 'High', orderable: false, },
          { title: 'Low', orderable: false, },
          { title: 'Close', orderable: false, },
          { title: 'Change', orderable: false, },
          { title: '', orderable: false, }
    ];
    var columnIndexes = [0, 1, 2, 3, 4, 5];
    if(is_tick) { /* for tick charts only show Date,Tick */
      columns = [
            { title: 'Date', orderable: false,
              render: function(epoch) { return moment.utc(epoch).format('YYYY-MM-DD HH:mm:ss'); }
            },
            { title: 'Tick', orderable: false, },
            { title: 'Change', orderable: false, },
            { title: '', orderable: false, }
      ];
      columnIndexes = [0, 1, 2];
    }
    table = table.dataTable({
        data: [],
        columns: columns,
        paging: false,
        ordering: true,
        info: false,
        order: [0, 'desc'],
        columnDefs: [{ className: "dt-head-center dt-body-center", "targets": columnIndexes}]
    });
    table.parent().addClass('hide-search-input');

    var on_tick = stream_handler.events.on('tick', function(data){
      if(data.key !== key) return;
      if(!dialog.view_table_visible) return;
      var tick = data.tick;
      var diff = calculatePercentageDiff(data.preTick.open, tick.open);
      var row = [tick.time, tick.open, diff.value, diff.image];
      table.api().row.add(row);
      table.api().draw();
    });

    var on_ohlc = stream_handler.events.on('ohlc', function(data){
      if(data.key !== key) return;
      if(!dialog.view_table_visible) return;
      var ohlc = data.ohlc;
      var diff = calculatePercentageDiff(data.preOhlc.close, ohlc.close);
      var row = [
        ohlc.time,
        ohlc.open,
        ohlc.high,
        ohlc.low,
        ohlc.close,
        diff.value,
        diff.image
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
