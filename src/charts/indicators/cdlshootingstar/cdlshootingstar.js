/**
 * Created by arnab on 12/06/15
 */

define(["jquery", "jquery-ui", 'color-picker'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['text!charts/indicators/cdlshootingstar/cdlshootingstar.html'], function ( $html ) {

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                modal: true,
                my: 'left',
                at: 'left',
                of: window,
                buttons: [
                    {
                        text: "OK",
                        click: function() {

                            var series = $($(".cdlshootingstar").data('refererChartID')).highcharts().series[0];
                            series.addIndicator('cdlshootingstar', {
                                cdlIndicatorCode : 'cdlshootingstar',
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

            if ($.isFunction(_callback))
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash ) {

            if ($(".cdlshootingstar").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".cdlshootingstar").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
