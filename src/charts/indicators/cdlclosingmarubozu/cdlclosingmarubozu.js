/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'common/loadCSS'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        $.get("charts/indicators/cdlclosingmarubozu/cdlclosingmarubozu.html" , function ( $html ) {

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                modal: true,
                buttons: [
                    {
                        text: "Ok",
                        click: function() {
                            //console.log('Ok button is clicked!');
                            require(["validation/validation"], function(validation) {

                                require(['charts/indicators/highcharts_custom/cdlclosingmarubozu'], function ( cdlclosingmarubozu ) {
                                    cdlclosingmarubozu.init();
                                    //Add CDLCLOSINGMARUBOZU for the main series
                                    $($(".cdlclosingmarubozu").data('refererChartID')).highcharts().series[0].addCDLCLOSINGMARUBOZU();
                                });

                                closeDialog.call($html);

                            });
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

            if ($(".cdlclosingmarubozu").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".cdlclosingmarubozu").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
