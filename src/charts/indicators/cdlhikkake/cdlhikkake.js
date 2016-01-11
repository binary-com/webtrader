﻿/**
 * Created by Mahboob.M on 12/31/15
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlhikkake/cdlhikkake.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlhikkake'], function (cdlhikkake) {
                                cdlhikkake.init();
                                //Add CDLHIKKAKE for the main series
                                $($(".cdlhikkake").data('refererChartID')).highcharts().series[0].addCDLHIKKAKE();
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

            if ($(".cdlhikkake").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlhikkake").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
