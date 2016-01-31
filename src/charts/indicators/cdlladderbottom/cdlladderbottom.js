/**
 * Created by MAhboob.M on 1/2/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlladderbottom/cdlladderbottom.html'], function ($html) {

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

                            var series = $($(".cdlladderbottom").data('refererChartID')).highcharts().series[0];
                            series.addIndicator('cdlladderbottom', {
                                cdlIndicatorCode : 'cdlladderbottom',
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

            if ($(".cdlladderbottom").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlladderbottom").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
