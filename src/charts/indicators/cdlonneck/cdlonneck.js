﻿/**
 * Created by MAhboob.M on 1/5/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlonneck/cdlonneck.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlonneck'], function (cdlonneck) {
                                cdlonneck.init();
                                //Add CDLONNECK for the main series
                                $($(".cdlonneck").data('refererChartID')).highcharts().series[0].addCDLONNECK();
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

            if ($(".cdlonneck").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlonneck").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
