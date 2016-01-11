/**
 * Created by MAhboob.M on 1/5/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlinneck/cdlinneck.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlinneck'], function (cdlinneck) {
                                cdlinneck.init();
                                //Add CDLINNECK for the main series
                                $($(".cdlinneck").data('refererChartID')).highcharts().series[0].addCDLINNECK();
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

            if ($(".cdlinneck").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlinneck").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
