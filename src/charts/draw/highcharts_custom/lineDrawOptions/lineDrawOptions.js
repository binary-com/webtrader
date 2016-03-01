/**
 * Created by Ankit on 26/2/16.
 */

define(["jquery", "common/util", 'jquery-ui', 'color-picker', 'ddslick'], function($) {

    var eventHandlerObj = null;


    var defaultStrokeColor = '#cd0a0a';
    var defaultStrokeWidth = 1;
    var selectedDashStyle = "Solid";

    var dialogOptions = {
        autoOpen: false,
        resizable: false,
        width: 350,
        modal: true,
        my: 'center',
        at: 'center',
        of: window,
        dialogClass: 'bop-ui-dialog',
        buttons: [{
            text: "OK",
            click: function() {

                $html = $(this);

                //Checking the Chart from which call was made
                var chartID = $(this).data('refererChartID') || $('.chartobject_add_dialog').data('refererChartID');

                defaultStrokeColor = $html.find("#bop_stroke").css("background-color");
                defaultStrokeWidth = parseInt($html.find("#bop_strokeWidth").val());
                selectedDashStyle = $('#bop_dashStyle').data('ddslick').selectedData.value;


                var drawOptions = {
                    chartID: chartID,
                    seriesRef: $(chartID).highcharts().series[0],
                    stroke: defaultStrokeColor,
                    strokeWidth: defaultStrokeWidth,
                    dashStyle: selectedDashStyle
                };

                // First Unbinding handler from a previous session
                $(chartID).off(eventHandlerObj.type, eventHandlerObj.handler);

                //Binding or Re-Binding handler with new Draw options
                $(chartID).on(eventHandlerObj.type, {
                    chartID: chartID,
                    drawOptions: drawOptions,
                    callback: null
                }, eventHandlerObj.handler);


                closeDialog.call($html);
            }
        }, {
            text: "Cancel",
            click: function() {
                closeDialog.call(this);
            }
        }]
    };



    /**    
     * This function should be called in the context of Jquery Object of the Dialog Box '$html'    
     */
    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }



    function openDialog(dialogID, containerIDWithHash, eventHandlerInfo) {

        var $dialog = $("." + dialogID);

        //If it has not been initiated, then init it first
        if ($dialog.length == 0) {

            this.initializeDialog(dialogID, containerIDWithHash, eventHandlerInfo, this.openDialog);
            //getDialog(dialogID, containerIDWithHash, this.openDialog);
            return;
        } else {

            //Updating the dialog options
            updateDialogOptions($dialog, eventHandlerInfo);

        }

        // Finally open the Dialog once all the Dialog files are fetched & Dialog Options updated
        $dialog.data('refererChartID', containerIDWithHash).dialog("open");

    }

    /**    
     * This function will only do the fetching & appending Operation of the Dialog Box
     * @param id - The UniqueID of this Dialog Box ( Based on this the particular file will be fetched )
     * @param chartID - The ID of the Chart on which the Dialog is invoked
     * @param eventHandlerInfo - The eventhandler Info to be passed to the Dialog button 'onclick' event 
     * @param callback - true if the update call is from Point.update, false for Series.update call
     */
    function initializeDialog(id, chartID, eventHandlerInfo, callback) {


        //Fetching Horizontaline-options popup Styles
        require(['css!charts/draw/highcharts_custom/' + id + '/' + id + '.css']);

        require(['text!charts/draw/highcharts_custom/' + id + '/' + id + '.html'], function($html) {


            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            // Calling the open dialog function 
            callback(id, chartID, eventHandlerInfo);
            return;
        });
    }


    /**    
     * This function should be called before each time the Dialog is to be opened  
     * @param options - The data update values
     * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
     */
    function updateDialogOptions($html, eventHandlerInfo) {
        eventHandlerObj = eventHandlerInfo;

        $html.find("#bop_stroke").colorpicker({
            part: {
                map: { size: 128 },
                bar: { size: 128 }
            },
            select: function(event, color) {
                $("#bop_stroke").css({
                    background: '#' + color.formatted
                }).val('');
                defaultStrokeColor = '#' + color.formatted;
            },
            ok: function(event, color) {
                $("#bop_stroke").css({
                    background: '#' + color.formatted
                }).val('');
                defaultStrokeColor = '#' + color.formatted;
            }
        });


        $('#bop_dashStyle').ddslick({
            imagePosition: "left",
            width: 118,
            background: "white",
            onSelected: function(data) {
                $('#bop_dashStyle .dd-selected-image').css('max-width', '85px');
                selectedDashStyle = data.selectedData.value
            }
        });
        $('#bop_dashStyle .dd-option-image').css('max-width', '85px');


        $html.dialog(dialogOptions);

    }


    return {
        initializeDialog: initializeDialog,
        openDialog: openDialog,
        closeDialog: closeDialog,
        updateDialogOptions: updateDialogOptions
    }
});
