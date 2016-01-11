/**
 * Created by Mahboob.M on 12/31/15
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlhomingpigeon/cdlhomingpigeon.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlhomingpigeon'], function (cdlhomingpigeon) {
                                cdlhomingpigeon.init();
                                //Add CDLHOMINGPIGEON for the main series
                                $($(".cdlhomingpigeon").data('refererChartID')).highcharts().series[0].addCDLHOMINGPIGEON();
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

            if ($(".cdlhomingpigeon").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlhomingpigeon").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
