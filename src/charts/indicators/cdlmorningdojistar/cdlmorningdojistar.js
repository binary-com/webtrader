/**
 * Created by Mahboob.M on 1/4/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlmorningdojistar/cdlmorningdojistar.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlmorningdojistar'], function (cdlmorningdojistar) {
                                cdlmorningdojistar.init();
                                //Add CDLMORNINGDOJISTAR for the main series
                                $($(".cdlmorningdojistar").data('refererChartID')).highcharts().series[0].addCDLMORNINGDOJISTAR();
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

            if ($(".cdlmorningdojistar").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlmorningdojistar").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
