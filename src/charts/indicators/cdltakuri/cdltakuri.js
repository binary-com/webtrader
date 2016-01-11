﻿/**
 * Created by Mahboob.M on 12/29/15
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdltakuri/cdltakuri.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdltakuri'], function (cdltakuri) {
                                cdltakuri.init();
                                //Add CDLTAKURI for the main series
                                $($(".cdltakuri").data('refererChartID')).highcharts().series[0].addCDLTAKURI();
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

            if ($(".cdltakuri").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdltakuri").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
