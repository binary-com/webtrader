/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "common/rivetsExtra", "jquery-ui", 'color-picker'], function($, rv) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['text!charts/indicators/cdl3linestrike/cdl3linestrike.html', 'text!charts/indicators/indicators.json'], function ( $html, data ) {

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.cdl3linestrike;
            var state = {
                "title": current_indicator_data.long_display_name,
                "description": current_indicator_data.description
            }
            rv.bind($html[0], state);

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                height:400,
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
