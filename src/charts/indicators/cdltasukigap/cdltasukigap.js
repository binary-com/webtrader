/**
 * Created by Mahboob.M on 12/28/15
 */
define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdltasukigap/cdltasukigap.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdltasukigap'], function (cdltasukigap) {
                                cdltasukigap.init();
                                //Add CDLTASUKIGAP for the main series
                                $($(".cdltasukigap").data('refererChartID')).highcharts().series[0].addCDLTASUKIGAP();
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

            if ($(".cdltasukigap").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdltasukigap").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
