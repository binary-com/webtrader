/**
 * Created by arnab on 12/06/15
 */

define(["jquery", "common/rivetsExtra", "jquery-ui", 'color-picker'], function($, rv) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['text!charts/indicators/cdlshootingstar/cdlshootingstar.html', 'text!charts/indicators/indicators.json'], function ( $html, data ) {

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.cdlshootingstar;
            var state = {
                "title": current_indicator_data.long_display_name,
                "description": current_indicator_data.description
            }
            rv.bind($html[0], state);

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                height: 400,
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
