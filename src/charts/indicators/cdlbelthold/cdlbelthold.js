/**
 * Created by Mahboob.M on 12/29/15
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlbelthold/cdlbelthold.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlbelthold'], function (cdlbelthold) {
                                cdlbelthold.init();
                                //Add CDLBELTHOLD for the main series
                                $($(".cdlbelthold").data('refererChartID')).highcharts().series[0].addCDLBELTHOLD();
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

            if ($(".cdlbelthold").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlbelthold").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
