/**
 * Created by Mahboob.M on 7/2/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlmathold/cdlmathold.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlmathold'], function (cdlmathold) {
                                cdlmathold.init();
                                //Add CDLMATHOLD for the main series
                                $($(".cdlmathold").data('refererChartID')).highcharts().series[0].addCDLMATHOLD();
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

            if ($(".cdlmathold").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlmathold").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
