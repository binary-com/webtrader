/**
 * Created by Mahboob.M on 12/30/15
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlharamicross/cdlharamicross.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlharamicross'], function (cdlharamicross) {
                                cdlharamicross.init();
                                //Add CDLHARAMICROSS for the main series
                                $($(".cdlharamicross").data('refererChartID')).highcharts().series[0].addCDLHARAMICROSS();
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

            if ($(".cdlharamicross").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlharamicross").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
