/**
 * Created by arnab on 3/1/15
 */
define(["jquery", "jquery-ui", 'color-picker'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['text!charts/indicators/cdlengulfing/cdlengulfing.html'], function ( $html ) {

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work

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

                            require(['charts/indicators/highcharts_custom/cdlengulfing'], function ( cdlengulfing ) {
                                cdlengulfing.init();
                                //Add CDLENGULFING for the main series
                                $($(".cdlengulfing").data('refererChartID')).highcharts().series[0].addCDLENGULFING();
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

            if ($(".cdlengulfing").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".cdlengulfing").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
