/**
 * Created by arnab on 2/13/15.
 */

define(["jquery","windows/windows","jquery.dialogextend"], function ($,windows) {

    "use strict";


    function _trigger_Resize_Effects() {
        $(this).find(".chartSubContainer").width($(this).width() - 15);
        $(this).find(".chartSubContainer").height($(this).height() - 10);

        var containerIDWithHash = "#" + $(this).find(".chartSubContainer").attr("id");
        require(["charts/charts"], function(charts) {
            charts.triggerReflow(containerIDWithHash);
        });
    }

    return {

        addNewWindow: function( instrumentCode, instrumentName, timePeriod, _callback, type ) {

            $.get("charts/chartWindow.html" , function( $html ) {

                var options = {
                    title: instrumentName + " (" + timePeriod + ")",
                    close: function () {
                            var id = $(this).attr('id');
                            var container = $("#" + id + "_chart");
                            var timeperiod = container.data("timeperiod");
                            var instrumentCode = container.data('instrumentCode');
                            $(this).dialog('destroy');//completely remove this dialog
                            require(["charts/charts"], function (charts) {
                                charts.destroy( "#" + id + "_chart", timeperiod, instrumentCode );
                            });
                    },
                    resize: _trigger_Resize_Effects
                };

                var dialog = windows.createBlankWindow($html, options),
                    id = dialog.attr('id');
                dialog.find('div.chartSubContainerHeader').attr('id', id + "_header").end()
                    .find('div.chartSubContainer').attr('id', id + "_chart").end();

                require(["charts/chartOptions"], function(chartOptions) {
                    chartOptions.init(id, timePeriod, type);
                });

                require(["charts/charts"], function (charts) {
                    charts.drawChart( "#" + id + "_chart", instrumentCode, instrumentName, timePeriod, type );
                });

                dialog.dialog('open');
                options.resize.call($html);

                if ( _callback )
                _callback(dialog);
            });

        },

        totalWindows : function() {
            return $("div.chart-dialog").length;
        },

        /**
         * @param callerContext - Should be the Jquery object for dialog
         */
        triggerResizeEffects : function( callerContext ) {
            _trigger_Resize_Effects.call( callerContext );
        }
    };

});
