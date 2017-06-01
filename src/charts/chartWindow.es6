/**
 * Created by arnab on 2/13/15.
 */
import $ from "jquery";
import windows from "../windows/windows";
import 'highstock-release/modules/offline-exporting';
import liveapi from '../websockets/binary_websockets';
import 'common/util';
import wtcharts from 'webtrader-charts';
import 'css!./chartWindow.css'

wtcharts.init({
   appId: liveapi.app_id,
   lang: 'en',
   server: 'wss://ws.binaryws.com/websockets/v3'
});

export const addNewWindow = function(options) {
    const options_copy = options;
    const $parent = $('<div/>');
    options = $.extend({
        title: options.instrumentName,
        relativePosition: true,
        close: function() {
            chart.actions.destroy();
            $(this).dialog('destroy').remove(); //completely remove this dialog
        },
        resize: () => chart && chart.actions.reflow(),
        refresh: () => chart.actions.refresh(),
        open: function() {
            const dialog = $(this);
            $(this).parent().promise().done(() => chart.actions.reflow());
        }
    }, options);
    const dialog = windows.createBlankWindow($parent, options);
    const chart = wtcharts.chartWindow.addNewChart($parent, options_copy);
    chart.actions.reflow();

    const update_track = dialog.track({
        module_id: 'chartWindow',
        is_unique: false,
        data: chart.data()
    });
    chart.events.anyChange = () => update_track(chart.data());

    dialog.dialog('open');

    return dialog;
};


export default {
    addNewWindow,
};
