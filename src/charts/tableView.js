/**
 * Created by amin january 21, 2016.
 */

define(['jquery', 'moment', 'lokijs', 'charts/chartingRequestMap', 'websockets/stream_handler', 'datatables'],
    function ($, moment, loki, chartingRequestMap, stream_handler) {
        var barsTable = chartingRequestMap.barsTable;

        var show_table_view = function (dialog, instrumentCode) {
            var table = dialog.find('.table-view');
            var chart = dialog.find('.chart-view');
            dialog.find('span.close').css('display', 'block');
            table.animate({left: '0'}, 250);
            chart.animate({left: '-100%'}, 250);
            refresh_table(dialog, instrumentCode);
            /* clear table and fill it again */
            //Adjust table column size
            var tbl = table.find('table').DataTable();
            tbl.columns.adjust().draw();
            dialog.view_table_visible = true;
            /* let stream_handler new ohlc or ticks update the table */
        }
        var hide_table_view = function (dialog) {
            var table = dialog.find('.table-view');
            var chart = dialog.find('.chart-view');
            dialog.find('span.close').css('display', 'none');
            table.animate({left: '100%'}, 250);
            chart.animate({left: '0'}, 250);
            dialog.view_table_visible = false;
        }

        function getColumns(is_tick) {
            var columns = [
                {
                    title: 'Date', orderable: false,
                    render: function (epoch) {
                        return moment.utc(epoch).format('YYYY-MM-DD HH:mm:ss');
                    }
                },
                {title: 'Open', orderable: false,},
                {title: 'High', orderable: false,},
                {title: 'Low', orderable: false,},
                {title: 'Close', orderable: false,},
                {title: 'Change', orderable: false,},
                {title: '', orderable: false,}
            ];
            var columnIndexes = [0, 1, 2, 3, 4, 5];
            if (is_tick) { /* for tick charts only show Date,Tick */
                columns = [
                    {
                        title: 'Date', orderable: false,
                        render: function (epoch) {
                            return moment.utc(epoch).format('YYYY-MM-DD HH:mm:ss');
                        }
                    },
                    {title: 'Tick', orderable: false,},
                    {title: 'Change', orderable: false,},
                    {title: '', orderable: false,}
                ];
                columnIndexes = [0, 1, 2];
            }
            return {columns: columns, columnIndexes: columnIndexes};
        }

        var refresh_table = function (dialog, instrumentCode) {
            var data = dialog.find('#' + dialog.attr('id') + '_chart').data();
            var is_tick = isTick(data.timePeriod);
            var table = dialog.find('.table-view');
            var bars = barsTable
                .chain()
                .find({instrumentCdAndTp: chartingRequestMap.keyFor(instrumentCode, data.timePeriod)})
                .simplesort('time', true)
                .limit(100)
                .data();
            var index = 0;
            var rows = bars.map(function (bar) {
                //The bars list has been sotrted by time ,The previous value is in next index
                var preBar = index == bars.length - 1 ? bars[index] : bars[index + 1];
                index++;
                if (is_tick) {
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
            api.destroy();
            table.find('table *').remove();
            var __ret = getColumns(is_tick);
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

        var calculatePercentageDiff = function (firstNumber, secondNumber) {
            /*Calculation = ( | V1 - V2 | / |V1| )* 100 */
            var diff = toFixed(Math.abs(firstNumber - secondNumber), 4);
            var Percentage_diff = toFixed((Math.abs(firstNumber - secondNumber) / Math.abs(firstNumber)) * 100, 2);
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

        function init(dialog) {
            var container = dialog.find('.table-view');
            var data = dialog.find('#' + dialog.attr('id') + '_chart').data();
            var is_tick = isTick(data.timePeriod);
            var close = dialog.find('span.close');
            close.on('click', hide_table_view.bind(null, dialog));
            /* hide the dialog on close icon click */

            var table = $("<table class='portfolio-dialog hover'/>");
            table.appendTo(container);

            var __ret = getColumns(is_tick);
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

            var on_tick = stream_handler.events.on('tick', function (d) {
                if (d.key !== chartingRequestMap.keyFor(data.instrumentCode, data.timePeriod)) return;
                if (!dialog.view_table_visible) return;
                var tick = d.tick;
                var diff = calculatePercentageDiff(d.preTick.open, tick.open);
                var row = [tick.time, tick.open, diff.value, diff.image];
                table.api().row.add(row);
                table.api().draw();
            });

            var on_ohlc = stream_handler.events.on('ohlc', function (d) {
                if (d.key !== chartingRequestMap.keyFor(data.instrumentCode, data.timePeriod)) return;
                if (!dialog.view_table_visible) return;
                var ohlc = d.ohlc;
                var diff = calculatePercentageDiff(d.preOhlc.close, ohlc.close);
                var row = [
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
                    var topRowIndex = table.api().rows()[0][0];
                    table.api().row(topRowIndex).data(row);
                }
                table.api().draw();
            });

            dialog.on('dialogdestroy', function () {
                stream_handler.events.off('tick', on_tick);
                stream_handler.events.off('ohlc', on_ohlc);
            });

            return {
                show: show_table_view.bind(null, dialog, data.instrumentCode),
                hide: hide_table_view.bind(null, dialog)
            }
        }

        return {init: init}
    });
