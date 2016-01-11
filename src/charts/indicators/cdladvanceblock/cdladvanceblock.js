/**
 * Created by Mahboob.M on 1/4/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdladvanceblock/cdladvanceblock.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdladvanceblock'], function (cdladvanceblock) {
                                cdladvanceblock.init();
                                //Add CDLADVANCEBLOCK for the main series
                                $($(".cdladvanceblock").data('refererChartID')).highcharts().series[0].addCDLADVANCEBLOCK();
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

            if ($(".cdladvanceblock").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdladvanceblock").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
