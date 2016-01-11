﻿/**
 * Created by Mahboob.M on 12/31/15
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdltristar/cdltristar.html'], function ($html) {

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
                            
                            require(['charts/indicators/highcharts_custom/cdltristar'], function (cdltristar) {
                                cdltristar.init();
                                //Add CDLTRISTAR for the main series
                                $($(".cdltristar").data('refererChartID')).highcharts().series[0].addCDLTRISTAR();
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

            if ($(".cdltristar").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdltristar").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
