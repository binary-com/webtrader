/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "datatables", "common/loadCSS", 'charts/charts'], function ($) {

    var table = undefined, indicatorsJSON = undefined;

    function init( containerIDWithHash, _callback ) {

        loadCSS("//cdn.datatables.net/1.10.5/css/jquery.dataTables.min.css");
        loadCSS("lib/jquery/jquery-ui/colorpicker/jquery.colorpicker.css");
        loadCSS("charts/indicators/indicators_remove.css");

        $.get("charts/indicators/indicators_remove.html", function($html) {
            $html = $($html);
            table = $html.hide().find('table').DataTable({
                paging: false,
                scrollY: 200,
                info: false
            });
            $html.appendTo("body");
            $( ".indicator_remove_dialog" ).dialog({
                autoOpen: false,
                resizable: false,
                buttons: [{
                    text: "Remove Selected",
                    click: function() {
                        console.log($(table).find('tr.selected').length);
                        $( ".indicator_remove_dialog" ).dialog('close');
                    }
                },{
                    text: "Cancel",
                    click: function() {
                        $( ".indicator_remove_dialog" ).dialog('close');
                    }
                }]
            });

            $.get('charts/indicators/indicators.json', function (jsonData) {
                indicatorsJSON = jsonData;
                if (typeof _callback == "function") {
                    _callback(containerIDWithHash);
                }
            });
        });
    }

    return {

        openDialog : function( containerIDWithHash ) {

            //If it has not been initiated, then init it first
            if ($(".indicator_remove_dialog").length == 0)
            {
                init( containerIDWithHash, this.openDialog);
                return;
            }

            //Clear previous entries and add list of indicators that are added for the referring chart
            table.clear().draw();
            var chart = $(containerIDWithHash).highcharts();
            if (!chart) return;
            var mainSeries = chart.series[0];
            //Find all custom indicator properties
            $.each(mainSeries, function (key, value) {
                if (!key || key.indexOf('Options') == -1 || !value) return;
                //Loop through the know indicator JSON details
                $.each(indicatorsJSON, function (indicatorDataKey, indicatorDataValue) {
                    //If we find <indicatorID>Options parameter in series, that means this indicator was added to this series
                    if (key.indexOf(indicatorDataValue.id + 'Options') != -1) {
                        //Now loop through all instances of this indicator. It could be used multiple times with different parameters
                        $.each(value, function (optionKey, optionValue) {
                            $(table.row.add([indicatorDataValue.long_display_name + '(' + optionValue.period + ')']).draw().node())
                                .click(function () {
                                    $(this).toggleClass('selected');
                                }).data('seriesID', key);
                        });
                        return false;
                    }
                });
            });

            $(".indicator_remove_dialog").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
