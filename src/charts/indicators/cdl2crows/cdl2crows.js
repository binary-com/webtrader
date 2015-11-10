/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['text!charts/indicators/cdl2crows/cdl2crows.html'], function ( $html ) {

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
                        text: "Ok",
                        click: function() {
                            //console.log('Ok button is clicked!');
                            require(["validation/validation"], function(validation) {

                                require(['charts/indicators/highcharts_custom/cdl2crows'], function ( cdl2crows ) {
                                    cdl2crows.init();
                                    //Add CDL2CROWS for the main series
                                    $($(".cdl2crows").data('refererChartID')).highcharts().series[0].addCDL2CROWS();
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

            if ($(".cdl2crows").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".cdl2crows").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
