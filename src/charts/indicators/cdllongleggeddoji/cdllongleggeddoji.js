/**
 * Created by Mahboob.M on 1/4/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdllongleggeddoji/cdllongleggeddoji.html'], function ($html) {

            $html = $($html);

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
                        click: function () {

                            require(['charts/indicators/highcharts_custom/cdllongleggeddoji'], function (cdllongleggeddoji) {
                                cdllongleggeddoji.init();
                                //Add CDLLONGLEGGEDDOJI for the main series
                                $($(".cdllongleggeddoji").data('refererChartID')).highcharts().series[0].addCDLLONGLEGGEDDOJI();
                            });

                            closeDialog.call($html);
                        }
                    },
                    {
                        text: "Cancel",
                        click: function () {
                            closeDialog.call(this);
                        }
                    }
                ]
            });

            if ($.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }

        });

    }

    return {

        open: function (containerIDWithHash) {

            if ($(".cdllongleggeddoji").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdllongleggeddoji").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
