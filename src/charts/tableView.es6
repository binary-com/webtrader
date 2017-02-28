/**
 * Created by amin january 21, 2016.
 */

import $ from 'jquery';
import moment from 'moment';
import loki from 'lokijs';
import chartingRequestMap from './chartingRequestMap';
import stream_handler from '../websockets/stream_handler';
import 'datatables';

const barsTable = chartingRequestMap.barsTable;

const show_table_view = (dialog, instrumentCode, offset) => {
   const table = dialog.find('.table-view');
   const chart = dialog.find('.chart-view');
   dialog.find('span.close').css('display', 'block');
   table.animate({left: '0'}, 250);
   chart.animate({left: '-100%'}, 250);
   refresh_table(dialog, instrumentCode, offset);
   /* clear table and fill it again */
   //Adjust table column size
   const tbl = table.find('table').DataTable();
   tbl.columns.adjust().draw();
   dialog.view_table_visible = true;
   /* let stream_handler new ohlc or ticks update the table */
}

const hide_table_view = (dialog) => {
   const table = dialog.find('.table-view');
   const chart = dialog.find('.chart-view');
   dialog.find('span.close').css('display', 'none');
   table.animate({left: '100%'}, 250);
   chart.animate({left: '0'}, 250);
   dialog.view_table_visible = false;
}

const getColumns = (is_tick, offset) => {
   let columns = [
      {
         title: 'Date', orderable: false,
         render: (epoch) => moment.utc(epoch).utcOffset(offset).format('YYYY-MM-DD HH:mm:ss')
      },
      {title: 'Open', orderable: false,},
      {title: 'High', orderable: false,},
      {title: 'Low', orderable: false,},
      {title: 'Close', orderable: false,},
      {title: 'Change', orderable: false,},
      {title: '', orderable: false,}
   ];
   let columnIndexes = [0, 1, 2, 3, 4, 5];
   if (is_tick) { /* for tick charts only show Date,Tick */
      columns = [
         {
            title: 'Date', orderable: false,
            render: (epoch) => moment.utc(epoch).utcOffset(offset).format('YYYY-MM-DD HH:mm:ss')
         },
         {title: 'Tick', orderable: false,},
         {title: 'Change', orderable: false,},
         {title: '', orderable: false,}
      ];
      columnIndexes = [0, 1, 2];
   }
   return {columns: columns, columnIndexes: columnIndexes};
}

const refresh_table = (dialog, instrumentCode, offset) => {
   const data = dialog.find('#' + dialog.attr('id') + '_chart').data();
   const is_tick = isTick(data.timePeriod);
   const table = dialog.find('.table-view');
   const bars = barsTable
      .chain()
      .find({instrumentCdAndTp: chartingRequestMap.keyFor(instrumentCode, data.timePeriod)})
      .simplesort('time', true)
      .limit(100)
      .data();
   let index = 0;
   const rows = bars.map((bar) => {
      //The bars list has been sotrted by time ,The previous value is in next index
      const preBar = index == bars.length - 1 ? bars[index] : bars[index + 1];
      index++;
      if (is_tick) {
         const diff = calculatePercentageDiff(preBar.open, bar.open);
         return [bar.time, bar.open, diff.value, diff.image];
      }
      const diff = calculatePercentageDiff(preBar.close, bar.close);
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
   let api = table.find('table').DataTable();
   api.rows().remove();
   api.destroy();
   table.find('table *').remove();
   const __ret = getColumns(is_tick, offset);
   table.find('table').dataTable({
      data: [],
      columns: __ret.columns,
      paging: false,
      ordering: true,
      info: false,
      order: [0, 'desc'],
      columnDefs: [{className: "dt-head-center dt-body-center", "targets": __ret.columnIndexes}]
   }).parent().addClass('hide-search-input');
   api = table.find('table').DataTable();

   api.rows.add(rows);
   api.draw();
};

const calculatePercentageDiff = (firstNumber, secondNumber) => {
   /*Calculation = ( | V1 - V2 | / |V1| )* 100 */
   const diff = toFixed(Math.abs(firstNumber - secondNumber), 4);
   const Percentage_diff = toFixed((Math.abs(firstNumber - secondNumber) / Math.abs(firstNumber)) * 100, 2);
   if (firstNumber <= secondNumber)
      return {
         value: diff + '(' + Percentage_diff + '%)',
         image: diff === 0 ? '' : '<img src="images/blue_up_arrow.svg" class="arrow-images"/>'
      };
   else
      return {
         value: '<span style="color:brown">' + diff + '(' + Percentage_diff + '%) </span>',
         image: diff === 0 ? '' : '<img src="images/orange_down_arrow.svg" class="arrow-images"/>'
      };
};

export const init = (dialog, offset) => {
   offset = offset ? offset *(-1) : 0;
   const container = dialog.find('.table-view');
   const data = dialog.find('#' + dialog.attr('id') + '_chart').data();
   const is_tick = isTick(data.timePeriod);
   const close = dialog.find('span.close');
   close.on('click', hide_table_view.bind(null, dialog));
   /* hide the dialog on close icon click */

   let table = $("<table class='portfolio-dialog hover'/>");
   table.appendTo(container);

   const __ret = getColumns(is_tick, offset);
   table = table.dataTable({
      data: [],
      columns: __ret.columns,
      paging: false,
      ordering: true,
      info: false,
      order: [0, 'desc'],
      columnDefs: [{className: "dt-head-center dt-body-center", "targets": __ret.columnIndexes}]
   });
   table.parent().addClass('hide-search-input');

   const on_tick = stream_handler.events.on('tick', (d) => {
      if (d.key !== chartingRequestMap.keyFor(data.instrumentCode, data.timePeriod)) return;
      if (!dialog.view_table_visible) return;
      const tick = d.tick;
      const diff = calculatePercentageDiff(d.preTick.open, tick.open);
      const row = [tick.time, tick.open, diff.value, diff.image];
      table.api().row.add(row);
      table.api().draw();
   });

   const on_ohlc = stream_handler.events.on('ohlc', (d) => {
      if (d.key !== chartingRequestMap.keyFor(data.instrumentCode, data.timePeriod)) return;
      if (!dialog.view_table_visible) return;
      const ohlc = d.ohlc;
      const diff = calculatePercentageDiff(d.preOhlc.close, ohlc.close);
      const row = [
         ohlc.time,
         ohlc.open,
         ohlc.high,
         ohlc.low,
         ohlc.close,
         diff.value,
         diff.image
      ];
      if (d.is_new) {
         table.api().row.add(row);
      }
      else {
         const topRowIndex = table.api().rows()[0][0];
         table.api().row(topRowIndex).data(row);
      }
      table.api().draw();
   });

   dialog.on('dialogdestroy', () => {
      stream_handler.events.off('tick', on_tick);
      stream_handler.events.off('ohlc', on_ohlc);
   });

   return {
      show: show_table_view.bind(null, dialog, data.instrumentCode, offset),
      hide: hide_table_view.bind(null, dialog)
   }
}

export default { init };
