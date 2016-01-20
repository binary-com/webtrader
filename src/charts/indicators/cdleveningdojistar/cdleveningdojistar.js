/**
 * Created by Mahboob.M on 1/4/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdleveningdojistar/cdleveningdojistar.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdleveningdojistar'], function (cdleveningdojistar) {
                                cdleveningdojistar.init();
                                //Add CDLEVENINGDOJISTAR for the main series
                                $($(".cdleveningdojistar").data('refererChartID')).highcharts().series[0].addCDLEVENINGDOJISTAR();
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

            if ($(".cdleveningdojistar").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdleveningdojistar").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
