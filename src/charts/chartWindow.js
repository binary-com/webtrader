/**
 * Created by arnab on 2/13/15.
 */

define(["jquery","windows/windows", "text!charts/chartWindow.html", "jquery.dialogextend"], function ($,windows, $chartWindowHtml) {

    "use strict";


    function _trigger_Resize_Effects() {
        $(this).find(".chartSubContainer").width($(this).width() - 20);
        $(this).find(".chartSubContainer").height($(this).height() - 10);

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
        addNewWindow: function( options ) {
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

            require(["charts/chartOptions"], function (chartOptions) {
                chartOptions.init(id, options.timePeriod, options.type);
            });

            require(["charts/charts"], function (charts) {
                charts.drawChart("#" + id + "_chart", options, options.resize.bind(dialog));

                /* after the chart is rendered initialize the export module */
                require(["charts/chartExport"], function (chartExport) {
                  chartExport.init(id);
                });
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
