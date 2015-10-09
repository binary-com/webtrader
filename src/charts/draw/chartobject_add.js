/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "datatables", "loadCSS", "common/util"], function ($) {

    function init( containerIDWithHash, _callback ) {

        $.get("charts/draw/chartobject_add.html", function($html) {
            $html = $($html);
            var table = $html.hide().find('table').DataTable({
                paging: false,
                scrollY: 200,
                info: false
            });

            //Attach row click listener
            table.rows().nodes().to$().click(function() {
              var className = $.trim(($(this).find('td').attr('class') || '').split(" ")[0]);
              require(["charts/draw/highcharts_custom/" + className], function(draw) {
                var refererChartID = $('.chartobject_add_dialog').data('refererChartID');
                $(refererChartID).highcharts().annotate = true;
                draw.init();
                $('.chartobject_add_dialog').dialog('close');
              });
            });

            $html.appendTo("body");
            $( ".chartobject_add_dialog" ).dialog({
                autoOpen: false,
                resizable: false,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                buttons: []
            });

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });
    }

    return {

        openDialog : function( containerIDWithHash ) {

            //If it has not been initiated, then init it first
            if ($(".chartobject_add_dialog").length == 0)
            {
                init( containerIDWithHash, this.openDialog);
                return;
            }

            $(".chartobject_add_dialog").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
