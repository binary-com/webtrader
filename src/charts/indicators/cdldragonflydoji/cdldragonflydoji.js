/**
 * Created by Mahboob.M on 1/3/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdldragonflydoji/cdldragonflydoji.html'], function ($html) {

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

                            var series = $($(".cdldragonflydoji").data('refererChartID')).highcharts().series[0];
                            series.addIndicator('cdldragonflydoji', {
                                cdlIndicatorCode : 'cdldragonflydoji',
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

            if ($(".cdldragonflydoji").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdldragonflydoji").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
