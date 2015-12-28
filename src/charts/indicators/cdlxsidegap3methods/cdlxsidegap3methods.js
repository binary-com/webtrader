/**
 * Created by Mahboob.M on 12/28/15
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlxsidegap3methods/cdlxsidegap3methods.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlxsidegap3methods'], function (cdlxsidegap3methods) {
                                cdlxsidegap3methods.init();
                                //Add CDLXSIDEGAP3METHODS for the main series
                                $($(".cdlxsidegap3methods").data('refererChartID')).highcharts().series[0].addCDLXSIDEGAP3METHODS();
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

            if ($(".cdlxsidegap3methods").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlxsidegap3methods").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
