/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "datatables", "common/loadCSS"], function ($) {

    function init( containerIDWithHash, _callback ) {

        loadCSS("//cdn.datatables.net/1.10.5/css/jquery.dataTables.min.css");
        loadCSS("lib/jquery/jquery-ui/colorpicker/jquery.colorpicker.css");
        loadCSS("charts/indicators/indicators_add.css");

        $.get("charts/indicators/indicators_add.html", function($html) {
            $html = $($html);
            var table = $html.hide().find('table').DataTable({
                paging: false,
                scrollY: 200,
                info: false
            });
            $html.appendTo("body");
            $( ".indicator_add_dialog" ).dialog({
                autoOpen: false,
                resizable: false,
                buttons: []
            });

            table.clear();

            $.get('charts/indicators/indicators.json', function (indicatorsJSON) {

                $.each(JSON.parse(indicatorsJSON), function (key, value) {
                    $(table.row.add([value.long_display_name]).draw().node())
                        .data("indicatorData", value)
                        .on('click', function () {
                            $( ".indicator_add_dialog").dialog( "close" );

                            var indicatorName = $(this).data('indicatorData').id;
                            require(["charts/indicators/" + indicatorName + "/" + indicatorName], function ( indicatorObj ) {
                                indicatorObj.open( $(".indicator_add_dialog").data('refererChartID') );
                            });
                        } );
                });

                if (typeof _callback == "function")
                {
                    _callback( containerIDWithHash );
                }

            }, 'text');

        });
    }

    return {

        openDialog : function( containerIDWithHash ) {

            //If it has not been initiated, then init it first
            if ($(".indicator_add_dialog").length == 0)
            {
                init( containerIDWithHash, this.openDialog);
                return;
            }

            $(".indicator_add_dialog").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
