/**
 * Created by Mahboob.M on 01/01/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlkicking/cdlkicking.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlkicking'], function (cdlkicking) {
                                cdlkicking.init();
                                //Add CDLKICKING for the main series
                                $($(".cdlkicking").data('refererChartID')).highcharts().series[0].addCDLKICKING();
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

            if ($(".cdlkicking").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlkicking").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
