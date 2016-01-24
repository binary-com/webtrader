/**
 * Created by Mahboob.M on 1/5/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlseparatinglines/cdlseparatinglines.html'], function ($html) {

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

                            var series = $($(".cdlseparatinglines").data('refererChartID')).highcharts().series[0];
                            series.addIndicator('cdlseparatinglines', {
                                cdlIndicatorCode : 'cdlseparatinglines',
                                onSeriesID : series.options.id
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

            if ($(".cdlseparatinglines").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlseparatinglines").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
