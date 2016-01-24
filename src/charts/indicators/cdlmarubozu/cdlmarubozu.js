/**
 * Created by Mahboob.M on 01/01/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlmarubozu/cdlmarubozu.html'], function ($html) {

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

                            var series = $($(".cdlmarubozu").data('refererChartID')).highcharts().series[0];
                            series.addIndicator('cdlmarubozu', {
                                cdlIndicatorCode : 'cdlmarubozu',
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

            if ($(".cdlmarubozu").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlmarubozu").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
