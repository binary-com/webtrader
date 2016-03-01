/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "datatables", 'charts/charts'], function($) {

    var table = undefined,
        indicatorsJSON = undefined;
    // This will hold the references of all the DrawTools Drawn on all the Charts on the current page
    var drawToolMapping = {};

    // This will be called in the Context of the Jquery Row Object
    function removeChartDrawTool() {

        var drawToolID = $(this).data('id'),
            chartID = $(this).data('chartID'),
            drawToolOptions = $(this).data('drawToolOptions');


        //Calling the destroy method to remove that DrawTool
        (drawToolOptions.destroy) ? drawToolOptions.destroy(): null;

    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/draw/chartobject_remove.html', 'charts/draw/chartobject_add'], function($html, chartDrawTools) {

            $html = $($html);
            drawToolMapping = chartDrawTools.drawToolMapping;
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
                    text: "Remove All",
                    click: function() {

                        var containerIDWithHash = $(".chartobject_remove_dialog").data('refererChartID');
                        table
                            .rows()
                            .nodes()
                            .to$().each(removeChartDrawTool);
                        $(".chartobject_remove_dialog").dialog('close');
                    }
                }, {
                    text: "Remove Selected",
                    click: function() {
                        var containerIDWithHash = $(".chartobject_remove_dialog").data('refererChartID');
                        table
                            .rows('.selected')
                            .nodes()
                            .to$().each(removeChartDrawTool);
                        $(".chartobject_remove_dialog").dialog('close');
                    }
                }, {
                    text: "Cancel",
                    click: function() {
                        $(".chartobject_remove_dialog").dialog('close');
                    }
                }]
            });

            require(['text!charts/indicators/indicators.json'], function(jsonData) {
                indicatorsJSON = jsonData;
                if (typeof _callback == "function") {
                    _callback(containerIDWithHash);
                }
            });
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


            // Loop through each unique DrawTool
            $.each(drawToolMapping, function(drawToolName, chartObj) {

                // Loop through each ChartID within the DrawTool
                $.each(chartObj, function(chartID, drawInstances) {

                    //True if ChartID matches the Current Chart on which the Remove is called
                    if (chartID == containerIDWithHash) {

                        // Loop / List through each instance of this DrawTool on this particular Chart
                        $.each(drawInstances, function(idx, value, arr) {

                            var drawToolID = value['uniqueName'],
                                chartID = value['chartID'],
                                drawToolOptions = value;

                            $(table.row.add([drawToolID]).draw().node())
                                .click(function() {
                                    $(this).toggleClass('selected');
                                }).data({
                                    'id': name,
                                    'chartID': chartID,
                                    'drawToolOptions': drawToolOptions
                                });

                        });
                    }

                });
            });

            $(".chartobject_remove_dialog").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
