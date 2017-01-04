/**
 * Created by Mahboob.M on 7/2/16
 */

define(["jquery", "common/rivetsExtra", "lodash", "jquery-ui", 'color-picker'], function($, rv, _) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlkickingbylength/cdlkickingbylength.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            $html = $($html);

            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.cdlkickingbylength;
            var state = {
                "title": current_indicator_data.long_display_name,
                "description": current_indicator_data.description
            }
            rv.bind($html[0], state);

            var options = {
                autoOpen: false,
                resizable: false,
                width: 350,
                height: 400,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                buttons: [
                    {
                        text: "OK",
                        click: function () {

                            var series = $($(".cdlkickingbylength").data('refererChartID')).highcharts().series[0];
                            series.addIndicator('cdlkickingbylength', {
                                cdlIndicatorCode : 'cdlkickingbylength',
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
                ],
                icons: {
                    close: 'custom-icon-close',
                    minimize: 'custom-icon-minimize',
                    maximize: 'custom-icon-maximize'
                }
            };
            $html.dialog(options)
              .dialogExtend(_.extend(options, {maximizable:false, minimizable:false, collapsable:false}));

            $html.closest('.ui-dialog').find('span.ui-dialog-title').attr('title', current_indicator_data.long_display_name);

            if ($.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }

        });

    }

    return {

        open: function (containerIDWithHash) {

            if ($(".cdlkickingbylength").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlkickingbylength").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
