/**
 * Created by arnab on 2/13/15.
 */

define(["jquery", "index"], function ($) {

    loadCSS('charts/charts.css');

    return {

        addNewTab: function( instrumentCode, instrumentName, timePeriod ) {

            if ($("#chartContainer ul li").length == 0) {
                //tab has not been initialize
                $("#chartContainer").tabs();
            }

            //first add a new li
            var newTabId = "tabs-" + $("#chartContainer ul li").length;
            var newLI = $("<li><a href='#" + newTabId + "'>" + instrumentName + " (" + timePeriod + ")" + "</a>"
                            + "<span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>");
            $("#chartContainer ul").append(newLI);
            //Attach close listener
            newLI.find("span.ui-icon-close").click(function() {
                var panelId = $( this ).closest( "li" ).remove().attr( "aria-controls" );
                $( "#" + panelId ).remove();
                $("#chartContainer").tabs( "refresh" );
                require(["charts/charts"], function (charts) {
                    charts.destroy( "#" + panelId + "_chart" );
                });
            });

            //then add the div for the new tab
            $("#chartContainer")
                .append($("<div id='" + newTabId + "'></div>")
                    .append($("<div id='" + newTabId + "_header'></div>").addClass('chartSubContainerHeader'))
                    .append($("<div id='" + newTabId + "_chart'></div>").addClass('chartSubContainer'))
                );
            $.get("charts/chartOptions.html", function($html) {
                $("#" + newTabId + "_header").prepend($html).find('button').button();
            });

            $(document).trigger('resize');

            $("#chartContainer").tabs("refresh");

            //activate this tab
            $("#chartContainer").tabs("option", "active", $("#chartContainer ul li").length - 1);

            require(["charts/charts"], function (charts) {
                charts.drawChart( "#" + newTabId + "_chart", instrumentCode, instrumentName, timePeriod );
            });
        }

    };

});
