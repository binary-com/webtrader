/**
 * Created by arnab on 2/13/15.
 */
import $ from "jquery";
import windows from "windows/windows";
import $chartWindowHtml from "text!charts/chartWindow.html";
import _ from 'lodash';
import "jquery.dialogextend";
import 'common/util';
import charts from "charts/charts";
import chartOptions from "charts/chartOptions";
import tableView from "charts/tableView";

function _trigger_Resize_Effects() {
    $(this).find(".chartSubContainer").width($(this).width() - 10);
    //Because of title taking space, we have to reduce height
    $(this).find(".chartSubContainer").height($(this).height() - 55);
    $(this).trigger("resize-event");
    const containerIDWithHash = "#" + $(this).find(".chartSubContainer").attr("id");
    charts.triggerReflow(containerIDWithHash);
}

const options_store = {};

/**
 * @param options
 * @returns {*}
 */
export const addNewWindow = function(options) {
    const options_copy = options;
    options = $.extend({
        title: options.instrumentName,
        relativePosition: true,
        close: function() {
            const id = $(this).attr('id');
            const container = $("#" + id + "_chart");
            const timePeriod = container.data("timePeriod");
            const instrumentCode = container.data('instrumentCode');
            container.highcharts().destroy();
            $(this).dialog('destroy').remove(); //completely remove this dialog
            charts.destroy({
                containerIDWithHash: "#" + id + "_chart",
                timePeriod: timePeriod,
                instrumentCode: instrumentCode
            });
            chartOptions.cleanBinding(id);
        },
        resize: _trigger_Resize_Effects,
        refresh: function() {
            charts.refresh('#' + id + '_chart');
        },
        open: function() {
            const dialog = $(this);
            $(this).parent().promise().done(function() {
                triggerResizeEffects(dialog);
            });
        }
    }, options);
    const dialog = windows.createBlankWindow($($chartWindowHtml).i18n(), options),
        id = dialog.attr('id');
    dialog.find('div.chartSubContainerHeader').attr('id', id + "_header").end()
        .find('div.chartSubContainer').attr('id', id + "_chart").end();



    /* tracking the chart, includion indicators & overlyas */
    options_store[id] = options_copy;
    options_store[id].indicators = options_store[id].indicators || [];
    options_store[id].overlays = options_store[id].overlays || [];
    const update_track = dialog.track({
        module_id: 'chartWindow',
        is_unique: false,
        data: options_store[id]
    });
    dialog.on('chart-type-changed', function(e, type) {
        options_store[id].type = type;
        update_track(options_store[id]);
    });
    dialog.on('chart-time-period-changed', function(e, timePeriod) {
        options_store[id].timePeriod = timePeriod;
        update_track(options_store[id]);
    });
    dialog.on('chart-indicators-changed', function(e, chart) {
        options_store[id].indicators = chart.get_indicators();
        update_track(options_store[id]);
    });
    dialog.on('chart-overlay-add', function(e, overlay) {
        options_store[id].overlays.push(overlay);
        update_track(options_store[id]);
    });
    dialog.on('chart-overlay-remove', function(e, displaySymbol) {
        _.remove(options_store[id].overlays, displaySymbol);
        update_track(options_store[id]);
    });
    dialog.on('chart-options-changed', function(e) {
        update_track(options_store[id]);
    });
    dialog.dialog('open');
    /* initialize chartOptions & table-view once chart is rendered */
    charts.drawChart("#" + id + "_chart", options, options.resize.bind($(dialog)));
    const table_view = tableView.init(dialog);
    chartOptions.init(id, options.timePeriod, options.type, table_view.show, options.instrumentName, options.instrumentCode);

    return dialog;
}

// This is for affiliates. Hope it works. Fingers crossed.
export const add_chart_options = function(id, options) {
    const dialog = $("#" + id);
    options_store[id] = options;
    options_store[id].indicators = options_store[id].indicators || [];
    options_store[id].overlays = options_store[id].overlays || [];
    dialog.on('chart-type-changed', function(e, type) {
        options_store[id].type = type;
    });
    dialog.on('chart-time-period-changed', function(e, timePeriod) {
        options_store[id].timePeriod = timePeriod;
    });
    dialog.on('chart-indicators-changed', function(e, chart) {
        options_store[id].indicators = chart.get_indicators();
    });
    dialog.on('chart-overlay-add', function(e, overlay) {
        options_store[id].overlays.push(overlay);
    });
    dialog.on('chart-overlay-remove', function(e, displaySymbol) {
        _.remove(options_store[id].overlays, displaySymbol);
    });
}

export const totalWindows = function() {
    return $("div.webtrader-dialog").length;
}

/* id of dialog. WITHOUT '#' prefix or '_chart' suffix */
export const get_chart_options = function(dialog_id) {
    const options = _.cloneDeep(options_store[dialog_id]);
    if (!options.name) {
        options.name = '';
    }
    return options;
}
export const set_chart_options = function(dialog_id, options) {
    options.instrumentCode = options_store[dialog_id].instrumentCode;
    options.instrumentName = options_store[dialog_id].instrumentName;
    options_store[dialog_id] = options;
    $('#' + dialog_id).trigger('chart-options-changed');
}
export const apply_chart_options = function(dialog_id, options) {
    chart_window_functions.set_chart_options(dialog_id, options);
    require(['charts/charts', 'charts/chartOptions'], function(charts, chartOptions) {
        chartOptions.updateOptions( /* update the chart options settings */
            dialog_id, options.type, options.timePeriod, options.indicators.length, options.overlays.length);
        charts.refresh('#' + dialog_id + '_chart', options.timePeriod, options.type, options.indicators, options.overlays);
    });
}

/**
 * @param callerContext - Should be the Jquery object for dialog
 */
export const triggerResizeEffects = function(callerContext) {
    _trigger_Resize_Effects.call(callerContext);
}

export const changeChartWindowTitle = function(dialogId, instrumentName, timePeriod) {
    $('#' + dialogId).dialog('option', 'title', instrumentName + " (" + timePeriod + ")");
}
const chart_window_functions = {
    addNewWindow,
    add_chart_options,
    totalWindows,
    get_chart_options,
    set_chart_options,
    apply_chart_options
};

export default chart_window_functions;
