/**
 * Created by arnab on 2/13/15.
 */

define(["jquery","windows/windows", "text!charts/chartWindow.html", 'lodash', "jquery.dialogextend"], function ($,windows, $chartWindowHtml, _) {

    "use strict";

    function _trigger_Resize_Effects() {
        $(this).find(".chartSubContainer").width($(this).width() - 10);
        $(this).find(".chartSubContainer").height($(this).height() - 15);

        var containerIDWithHash = "#" + $(this).find(".chartSubContainer").attr("id");
        require(["charts/charts"], function(charts) {
            charts.triggerReflow(containerIDWithHash);
        });
    }

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
                    $(this).dialog('destroy');//completely remove this dialog
                    require(["charts/charts"], function (charts) {
                        charts.destroy({
                            containerIDWithHash : "#" + id + "_chart",
                            timePeriod : timePeriod,
                            instrumentCode : instrumentCode
                        });
                    });
                },
                resize: _trigger_Resize_Effects
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
                    chartOptions.init(id, options.timePeriod, options.type, table_view.show, options.instrumentName);
                });
            });

            /* tracking the chart, includion indicators & overlyas */
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

        /**
         * @param callerContext - Should be the Jquery object for dialog
         */
        triggerResizeEffects : function( callerContext ) {
            _trigger_Resize_Effects.call( callerContext );
        }
    };

});
