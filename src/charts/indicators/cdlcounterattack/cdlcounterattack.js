/**
 * Created by Mahboob.M on 1/4/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlcounterattack/cdlcounterattack.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlcounterattack'], function (cdlcounterattack) {
                                cdlcounterattack.init();
                                //Add CDLCOUNTERATTACK for the main series
                                $($(".cdlcounterattack").data('refererChartID')).highcharts().series[0].addCDLCOUNTERATTACK();
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

            if ($(".cdlcounterattack").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlcounterattack").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
