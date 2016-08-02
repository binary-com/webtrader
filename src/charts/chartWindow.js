/**
 * Created by arnab on 2/13/15.
 */

define(["jquery","windows/windows", "text!charts/chartWindow.html", 'lodash', "jquery.dialogextend", 'common/util'], function ($,windows, $chartWindowHtml, _) {

    "use strict";

    function _trigger_Resize_Effects() {
        $(this).find(".chartSubContainer").width($(this).width() - 10);
        //Because of title taking space, we have to reduce height
        $(this).find(".chartSubContainer").height($(this).height() - 55);

        var containerIDWithHash = "#" + $(this).find(".chartSubContainer").attr("id");
        require(["charts/charts"], function(charts) {
            charts.triggerReflow(containerIDWithHash);
        });
    }

    var chart_options_store = {};
    return {

        /**
         * @param options
         * @returns {*}
         */
        addNewWindow: function(options) {
            var options_copy = options;
            options = $.extend({
                title: options.instrumentName + " (" + options.timePeriod + ")",
                close: function () {
                    var id = $(this).attr('id');
                    var container = $("#" + id + "_chart");
                    var timePeriod = container.data("timePeriod");
                    var instrumentCode = container.data('instrumentCode');
                    container.highcharts().destroy();
                    $(this).dialog('destroy').remove(); //completely remove this dialog
                    require(["charts/charts"], function (charts) {
                        charts.destroy({
                            containerIDWithHash : "#" + id + "_chart",
                            timePeriod : timePeriod,
                            instrumentCode : instrumentCode
                        });
                    });
                    require(["charts/chartOptions"], function (chartOptions) {
                        chartOptions.cleanBinding( id );
                    });
                },
                resize: _trigger_Resize_Effects,
                refresh: function() {
                    require(["charts/charts"], function( charts ) {
                        charts.refresh( '#' + id + '_chart' );
                    });
                }
            }, options );

            var dialog = windows.createBlankWindow($chartWindowHtml, options),
                id = dialog.attr('id');
            dialog.find('div.chartSubContainerHeader').attr('id', id + "_header").end()
                .find('div.chartSubContainer').attr('id', id + "_chart").end();

            require(["charts/charts"], function (charts) {
                charts.drawChart("#" + id + "_chart", options, options.resize.bind(dialog));

                /* initialize chartOptions & table-view once chart is rendered */
                require(["charts/chartOptions", "charts/tableView"], function (chartOptions, tableView) {
                    var table_view = tableView.init(dialog);
                    chartOptions.init(id, options.timePeriod, options.type, table_view.show, options.instrumentName, options.instrumentCode);
                });
            });

            /* tracking the chart, includion indicators & overlyas */
            chart_options_store[id] = options_copy;
            options_copy.indicators = options_copy.indicators || [];
            options_copy.overlays = options_copy.overlays || [];
            var update_track = dialog.track({
              module_id: 'chartWindow',
              is_unique: false,
              data: options_copy
            });
            dialog.on('chart-type-changed', function(e, type){
              options_copy.type = type;
              update_track(options_copy);
            });

            dialog.on('chart-indicators-changed',function(e, chart){
              options_copy.indicators = chart.get_indicators();
              update_track(options_copy);
            });
            dialog.on('chart-overlay-add',function(e, overlay){
              options_copy.overlays.push(overlay);
              update_track(options_copy);
            });
            dialog.on('chart-overlay-remove',function(e, displaySymbol){
              _.remove(options_copy.overlays, displaySymbol);
              update_track(options_copy);
            });
            dialog.dialog('open');

            return dialog;
        },

        totalWindows : function() {
            return $("div.webtrader-dialog").length;
        },

        /* id of dialog. WITHOUT '#' prefix or '_chart' suffix */
        get_chart_options: function(dialog_id) {
          return _.cloneDeep(chart_options_store[dialog_id]);
        },

        /**
         * @param callerContext - Should be the Jquery object for dialog
         */
        triggerResizeEffects : function( callerContext ) {
            _trigger_Resize_Effects.call( callerContext );
        },

        changeChartWindowTitle : function(dialogId, instrumentName, timePeriod) {
            $('#' + dialogId).dialog('option', 'title', instrumentName + " (" + timePeriod + ")");
        }
    };

});
