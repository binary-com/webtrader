/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "datatables", "common/loadCSS"], function ($) {

    function init( containerIDWithHash, _callback ) {

        loadCSS("jquery/jquery-ui/datatables/dataTables.jqueryui.css");
        loadCSS("jquery/jquery-ui/colorpicker/jquery.colorpicker.css");
        loadCSS("charts/indicators/indicators.css");

        $.get("charts/indicators/indicators.html", function($html) {
            $html = $($html);
            $html.hide().find('table').DataTable({
                paging: false,
                scrollY: 200,
                info: false
            });
            $html.find('tbody').on('click', 'tr', function () {
                //$(this).toggleClass('selected');
                //$(this).closest('tbody').find('tr').not($(this)).removeClass('selected');
                //if ($(this).hasClass('selected')) {
                    $( ".indicator_dialog").dialog( "close" );
                    var classes = $(this).attr('class').split(' ');
                    var indicatorName = null;
                    for (var index = 0 ; index < classes.length; index++)
                    {
                        if (classes[index].indexOf('indicator_') != -1)
                        {
                            indicatorName = classes[index].replace("indicator_", "");
                            break;
                        }
                    }
                    require(["charts/indicators/" + indicatorName + "/" + indicatorName], function ( indicatorObj ) {
                        indicatorObj.open( containerIDWithHash );
                    });
                //}
            } );
            $html.appendTo("body");
            $( ".indicator_dialog" ).dialog({
                autoOpen: false,
                resizable: false,
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
            if ($(".indicator_dialog").length == 0)
            {
                init( containerIDWithHash, this.openDialog);
                return;
            }

            $(".indicator_dialog").dialog("open");

        }

    };

});
