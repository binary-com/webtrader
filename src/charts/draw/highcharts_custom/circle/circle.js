/**
 * Created by Ankit on 26/2/16.
 */

define(["jquery", "common/util", 'jquery-ui', 'color-picker', 'ddslick'], function($) {

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
        dialogClass: 'shape-ui-dialog',
        buttons: [{
            text: "OK",
            click: function() {

                $html = $(this);

                //Checking the Chart from which call was made
                var chartID = $(this).data('refererChartID') || $('.chartobject_add_dialog').data('refererChartID');

                var drawTool = $(this).data('reference');


                defaultStrokeColor = $html.find("#shape_stroke").css("background-color");
                defaultFillColor = $html.find("#shape_fill").css("background-color");
                defaultStrokeWidth = parseInt($html.find("#shape_strokeWidth").val());


                var drawOptions = {
                    chartID: chartID,
                    seriesRef: $(chartID).highcharts().series[0],
                    stroke: defaultStrokeColor,
                    'stroke-width': defaultStrokeWidth,
                    fill: defaultFillColor
                };


                //CLOSING THE DRAW OPTIONS DIALOG
                closeDialog.call($html);

                if (drawTool) {
                    drawTool.drawOptions = drawOptions;
                    drawTool.addEventhandlers(drawOptions);
                }

            }
        }, {
            text: "Cancel",
            click: function() {
                closeDialog.call(this);
            }
        }]
    };

    this.$dialog = null;

    /**    
     * This function should be called in the context of Jquery Object of the Dialog Box '$html'    
     */
    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }



    function openDialog(containerIDWithHash, callback) {

        this.$dialog = this.$dialog || $(".shapeDrawOptions");

        //If it has not been initiated, then init it first
        if (this.$dialog.length == 0) {

            this.initializeDialog(containerIDWithHash, callback);
            //getDialog(dialogID, containerIDWithHash, this.openDialog);
            return this.$dialog;
        } else {
            //Updating the dialog options
            updateDialogOptions(this.$dialog);
        }

        // Finally open the Dialog once all the Dialog files are fetched & Dialog Options updated
        this.$dialog.data('refererChartID', containerIDWithHash).dialog("open");
        callback(this.$dialog);
    }

    /**    
     * This function will only do the fetching & appending Operation of the Dialog Box
     * @param id - The UniqueID of this Dialog Box ( Based on this the particular file will be fetched )
     * @param chartID - The ID of the Chart on which the Dialog is invoked
     * @param eventHandlerInfo - The eventhandler Info to be passed to the Dialog button 'onclick' event 
     * @param callback - true if the update call is from Point.update, false for Series.update call
     */
    function initializeDialog(chartID, callback) {

        var self = this;
        //Fetching Horizontaline-options popup Styles
        require(['css!charts/draw/highcharts_custom/circle/circle.css']);

        require(['text!charts/draw/highcharts_custom/circle/circle.html'], function($html) {


            self.$dialog = $($html);
            //$html.hide();
            self.$dialog.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            self.$dialog.find("input[type='button']").button();

            // Calling the open dialog function 
            self.openDialog(chartID, callback);
            return;
        });
    }


    /**    
     * This function should be called before each time the Dialog is to be opened  
     * @param options - The data update values
     * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
     */
    function updateDialogOptions($html) {
        //eventHandlerObj = eventHandlerInfo;

        $html.find("#shape_stroke").colorpicker({
            part: {
                map: { size: 128 },
                bar: { size: 128 }
            },
            select: function(event, color) {
                $("#shape_stroke").css({
                    background: '#' + color.formatted
                }).val('');
                defaultStrokeColor = '#' + color.formatted;
            },
            ok: function(event, color) {
                $("#shape_stroke").css({
                    background: '#' + color.formatted
                }).val('');
                defaultStrokeColor = '#' + color.formatted;
            }
        });

        $html.find("#shape_fill").colorpicker({
            part: {
                map: { size: 128 },
                bar: { size: 128 }
            },
            select: function(event, color) {
                $("#shape_fill").css({
                    background: '#' + color.formatted
                }).val('');
                defaultStrokeColor = '#' + color.formatted;
            },
            ok: function(event, color) {
                $("#shape_fill").css({
                    background: '#' + color.formatted
                }).val('');
                defaultStrokeColor = '#' + color.formatted;
            }
        });
        $html.dialog(dialogOptions);

    }


    return {
        $dialog: $dialog,
        initializeDialog: initializeDialog,
        openDialog: openDialog,
        closeDialog: closeDialog,
        updateDialogOptions: updateDialogOptions
    }
});