/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['text!charts/indicators/cdl3linestrike/cdl3linestrike.html'], function ( $html ) {

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                buttons: [
                    {
                        text: "OK",
                        click: function() {
                            var series = $($(".cdl3linestrike").data('refererChartID')).highcharts().series[0];
                            series.addIndicator('cdl3linestrike', {
                                cdlIndicatorCode : 'cdl3linestrike',
                                onSeriesID : series.options.id
                            });
                            closeDialog.call($html);
                        }
                    },
                    {
                        text: "Cancel",
                        click: function() {
                            closeDialog.call(this);
                        }
                    }
                ]
            });

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash ) {

            if ($(".cdl3linestrike").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".cdl3linestrike").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
