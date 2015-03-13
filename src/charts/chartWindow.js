/**
 * Created by arnab on 2/13/15.
 */

define(["jquery", "main"], function ($) {

    "use strict";

    var chartDialogCounter = 0;

    function _trigger_Resize_Effects() {
        //console.log($(this).width() - 10);
        $(this).find(".chartSubContainer").width($(this).width() - 30);
        $(this).find(".chartSubContainer").height($(this).height() - 10);

        //$(window).resize();
        var containerIDWithHash = "#" + $(this).find(".chartSubContainer").attr("id");
        require(["charts/charts"], function(charts) {
            charts.triggerReflow(containerIDWithHash);
        });
    }

    return {

        addNewWindow: function( instrumentCode, instrumentName, timePeriod, _callback, type ) {

            //first add a new li
            var newTabId = "chart-dialog-" + ++chartDialogCounter;
            //console.log(newTabId)
            $.get("charts/chartWindow.html" , function( $html ) {

                $html = $($html);
                $html.attr("id", newTabId)
                    .dialog({
                        autoOpen: false,
                        resizable: true,
                        minWidth: 350,
                        minHeight: 400,
                        width: 350,
                        height: 400,
                        title: instrumentName + " (" + timePeriod + ")",
                        close : function() {
                            console.log('Destroying dialog ' + newTabId);
                            $(this).dialog('destroy');//completely remove this dialog
                            require(["charts/charts"], function (charts) {
                                charts.destroy( "#" + newTabId + "_chart" );
                            });
                        },
                        resize: function() {
                            _trigger_Resize_Effects.call(this);
                        }
                    })
                    .find('div.chartSubContainerHeader').attr('id', newTabId + "_header").end()
                    .find('div.chartSubContainer').attr('id', newTabId + "_chart").end()
                    ;

                require(["charts/chartOptions"], function(chartOptions) {
                    chartOptions.init(newTabId, timePeriod);
                });

                $('#' + newTabId).dialog( 'open' );
                _trigger_Resize_Effects.call($('#' + newTabId));

                require(["charts/charts"], function (charts) {
                    charts.drawChart( "#" + newTabId + "_chart", instrumentCode, instrumentName, timePeriod, type );
                });

                if ( _callback )
                _callback( $('#' + newTabId) );

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
