/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "datatables", "common/util"], function($) {


    // This will hold the references of all the DrawTools Drawn on all the Charts on the current page
     var drawToolMapping={};

     var unbindHandlerMapping={};

    function init(containerIDWithHash, _callback) {

        require(['text!charts/draw/chartobject_add.html'], function($html) {
            $html = $($html);
            var table = $html.hide().find('table').DataTable({
                paging: false,
                scrollY: 200,
                info: false
            });

            //Attach row click listener
            table.rows().nodes().to$().click(function() {
                var className = $.trim(($(this).find('td').attr('class') || '').split(" ")[0]);
                require(["charts/draw/highcharts_custom/" + className, "text!charts/draw/draw.json"], function(drawTool, draw) {

                    //Getting Custom Settings for a Draw Tool
                    var drawToolOptions = JSON.parse(draw)[className];

                    var refererChartID = $('.chartobject_add_dialog').data('refererChartID');
                    $(refererChartID).highcharts().annotate = true;

                    //If previously chart had a handler attached then unbind it first before initializing a new DrawTool
                    if(unbindHandlerMapping[refererChartID]){
                        unbindHandlerMapping[refererChartID]();
                    }


                    //This will add the Draw-Tool features to the Highchart prototype 
                    drawTool.init(refererChartID);

                    // Saving the Current/Latest DrawTool unbindingHandler for the Current Chart
                    unbindHandlerMapping[refererChartID]=drawTool.unbindHandlers.bind(drawTool,refererChartID);

                    $('.chartobject_add_dialog').dialog('close');

                    // Saving the DrawTool Information 
                    drawToolMapping[className]=drawTool.drawToolMapping;


                    //Open a secondary Drawing Tools options-popup 
                    if (drawToolOptions['hasDrawOptions']) {

                        //Using setTimeout to let the any other open Dialog box to close
                        //TODO: Find way to open this Dialog Box on other Dialog Boxes 'Close' Event
                        setTimeout(function() {
                            drawTool.openDialog(drawToolOptions['dialogID'], refererChartID);
                        }, 500);

                    }

                });
            });

            $html.appendTo("body");
            $(".chartobject_add_dialog").dialog({
                autoOpen: false,
                resizable: false,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                buttons: []
            });

            if (typeof _callback == "function") {
                _callback(containerIDWithHash);
            }

        });
    }

    return {
        // This will hold the references of all the DrawTools Drawn on all the Charts on the current page
        drawToolMapping:drawToolMapping,
        openDialog: function(containerIDWithHash) {

            //If it has not been initiated, then init it first
            if ($(".chartobject_add_dialog").length == 0) {
                init(containerIDWithHash, this.openDialog);
                return;
            }

            $(".chartobject_add_dialog").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
