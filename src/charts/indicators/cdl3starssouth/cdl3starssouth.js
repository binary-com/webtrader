/**
 * Created by arnab on 3/1/15
 */

define(["jquery", "jquery-ui", 'color-picker'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['text!charts/indicators/cdl3starssouth/cdl3starssouth.html'], function ( $html ) {

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
                        text: "Ok",
                        click: function() {

                            require(['charts/indicators/highcharts_custom/cdl3starssouth'], function ( cdl3starssouth ) {
                                cdl3starssouth.init();
                                //Add CDL3STARSSOUTH for the main series
                                $($(".cdl3starssouth").data('refererChartID')).highcharts().series[0].addCDL3STARSSOUTH();
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

            if ($(".cdl3starssouth").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".cdl3starssouth").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
