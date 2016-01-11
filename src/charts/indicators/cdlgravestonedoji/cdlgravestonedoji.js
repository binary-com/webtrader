/**
 * Created by Mahboob.M on 12/30/15
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlgravestonedoji/cdlgravestonedoji.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlgravestonedoji'], function (cdlgravestonedoji) {
                                cdlgravestonedoji.init();
                                //Add CDLGRAVESTONEDOJI for the main series
                                $($(".cdlgravestonedoji").data('refererChartID')).highcharts().series[0].addCDLGRAVESTONEDOJI();
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

            if ($(".cdlgravestonedoji").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlgravestonedoji").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
