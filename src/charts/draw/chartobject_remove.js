/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "datatables", 'charts/charts'], function ($) {

    var table = undefined, indicatorsJSON = undefined;

    function init( containerIDWithHash, _callback ) {

        require(['text!charts/indicators/indicators_remove.html'], function($html) {
            $html = $($html);
            table = $html.hide().find('table').DataTable({
                paging: false,
                scrollY: 200,
                info: false
            });
            $html.appendTo("body");
            $( ".indicator_remove_dialog" ).dialog({
                autoOpen: false,
                modal: true,
                my: 'center',
                at: 'center',
                width: 330,
                of: window,
                resizable: false,
                buttons: [{
                    text: "Remove Selected",
                    click: function() {
                      var containerIDWithHash = $(".indicator_remove_dialog").data('refererChartID');
                        table
                            .rows( '.selected' )
                            .nodes()
                            .to$().each(function () {
                                var seriesID = $(this).data('seriesID');
                                var parentSeriesID = $(this).data('parentSeriesID');
                                var indicatorID = $(this).data('id');
                                var chart = $(containerIDWithHash).highcharts();
                                $.each(chart.series, function (index, series) {
                                    if (series.options.id == parentSeriesID) {
                                        var functionName = series['remove' + $.trim(indicatorID).toUpperCase()];
                                        functionName.call(series, seriesID);
                                        return false;
                                    }
                                });
                            });
                        $( ".indicator_remove_dialog" ).dialog('close');
                    }
                },{
                    text: "Cancel",
                    click: function() {
                        $( ".indicator_remove_dialog" ).dialog('close');
                    }
                }]
            });

            require(['text!charts/indicators/indicators.json'], function (jsonData) {
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
            $.each(chart.series, function (index, series) {
                if ($(this).data('isIndicator')) {
                    $.each(indicatorsJSON, function (indicatorDataKey, indicatorDataValue) {
                        if (series.options.name.indexOf(indicatorDataValue.short_display_name) != -1) {
                            var period_text = $(series).data('period') ? '(' + $(series).data('period') + ')' : '';
                            $(table.row.add([indicatorDataValue.long_display_name + period_text]).draw().node())
                                .click(function () {
                                    $(this).toggleClass('selected');
                                }).data({
                                    'id': indicatorDataValue.id,
                                    'seriesID': series.options.id,
                                    'parentSeriesID': $(series).data('parentSeriesID')
                                });
                            return false;
                        }
                    });
                }
            });

            $(".indicator_remove_dialog").data('refererChartID', containerIDWithHash).dialog("open");

        },

        showToast : function(containerIDWithHash){
            var chart = $(containerIDWithHash).highcharts(),
                middle = chart.chartWidth/2 - 130,
                text = "Double click the object to remove.";
            
            chart.toast = chart.renderer.label(text, chart.plotLeft + middle, chart.plotTop)
                .attr({
                    fill: Highcharts.getOptions().colors[0],
                    padding: 10,
                    r: 5,
                    zIndex: 8,
                    opacity: 0.95
                })
                .css({
                    color: '#FFFFFF'
                })
                .add();

            setTimeout(function () {
                chart.toast.fadeOut();
            }, 2000);
            setTimeout(function () {
                chart.toast = chart.toast.destroy();
            }, 2500);
        }
    };

});
