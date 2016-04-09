/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "datatables", 'charts/charts'], function($) {

    var table = undefined,
        indicatorsJSON = undefined;

    function init(containerIDWithHash, _callback) {

        require(['text!charts/draw/chartobject_remove.html'], function($html) {
            $html = $($html);
            table = $html.hide().find('table').DataTable({
                paging: false,
                scrollY: 200,
                info: false
            });
            $html.appendTo("body");
            $(".chartobject_remove_dialog").dialog({
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
                        var containerIDWithHash = $(".chartobject_remove_dialog").data('refererChartID');
                        table
                            .rows('.selected')
                            .nodes()
                            .to$().each(function() {
                                var drawToolID = $(this).data('toolID'),
                                    chartID = $(this).data('chartID'),
                                    drawToolRef = $(this).data('drawToolRef');

                                table.row($(this)).remove().draw();

                                // Remove using prototype method    
                                if (drawToolRef.destroyDrawTool) {
                                    drawToolRef.destroyDrawTool();
                                    return;
                                }
                                //OR
                                //Remove using highchart's in-built 'destroy' method
                                (drawToolRef.destroy) ? drawToolRef.destroy(): null;
                            });

                    }
                }, {
                    text: "Cancel",
                    click: function() {
                        $(".chartobject_remove_dialog").dialog('close');
                    }
                }]
            });

            if (typeof _callback == "function") {
                _callback(containerIDWithHash);
            }
        });
    }
    return {

        openDialog: function(containerIDWithHash) {

            //If it has not been initiated, then init it first
            if ($(".chartobject_remove_dialog").length == 0) {
                init(containerIDWithHash, this.openDialog);
                return;
            }

            //Clear previous entries and add list of indicators that are added for the referring chart
            table.clear().draw();
            var chart = $(containerIDWithHash).highcharts();
            if (!chart) return;

            //Getting the list of all Drawings on the specified Chart
            var drawToolList = $(containerIDWithHash).data('tools');

            $.each(drawToolList, function(idx, drawTool) {

                $(table.row.add([drawTool.toolID]).draw().node())
                    .click(function() {
                        $(this).toggleClass('selected');
                    }).data({
                        'toolID': drawTool.toolID,
                        'chartID': containerIDWithHash || drawTool.chartID,
                        'drawToolRef': drawTool
                    });


            });

            $(".chartobject_remove_dialog").data('refererChartID', containerIDWithHash).dialog("open");
        }

    };


});
