/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "datatables", 'charts/charts'], function ($) {

    var table = undefined, indicatorsJSON = undefined;
    require(['text!charts/indicators/indicators.json'], function (json) {
        indicatorsJSON = JSON.parse(json);
    });

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
                      var rowCount = table.rows('.selected').data().length;
                      if(rowCount > 0) {
                        var containerIDWithHash = $(".indicator_remove_dialog").data('refererChartID');
                        table
                            .rows( '.selected' )
                            .nodes()
                            .to$().each(function () {
                                var seriesIDs = $(this).data('seriesIDs');
                                var chart = $(containerIDWithHash).highcharts();
                                chart.series.forEach(function(series) {
                                    if (series.options.isInstrument) {
                                        series.removeIndicator(seriesIDs);
                                    }
                                });
                                table.row($(this)).remove().draw();
                            });

                        //Feature request https://trello.com/c/udgxUvGT/213-test-wma
                        //$( ".indicator_remove_dialog" ).dialog('close');
                      } else {
                        $.growl.error({ message: "Please select indicators to remove" });
                      }
                    }
                },{
                    text: "Cancel",
                    click: function() {
                        $( ".indicator_remove_dialog" ).dialog('close');
                    }
                }]
            });

            if ($.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }

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
            chart.series.forEach(function (series) {
                if (series.options.isInstrument) {
                    for (var key in indicatorsJSON) {
                        var each = indicatorsJSON[key];
                        if (series[each.id]) {//This is a check to find out, if this indicator was loaded for this chart
                            series[each.id].forEach(function (eachInstanceOfTheIndicator) {
                                var indicatorNameWithParams = eachInstanceOfTheIndicator.toString();
                                $(table.row.add([indicatorNameWithParams]).draw().node())
                                    .click(function () {
                                        $(this).toggleClass('selected');
                                    }).data({
                                        'seriesIDs': eachInstanceOfTheIndicator.getIDs()
                                    });
                            });
                        }
                    }
                }
            });

            $(".indicator_remove_dialog").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
