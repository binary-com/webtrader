/**
 * Created by Mahboob.M on 1/2/16
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['text!charts/indicators/cdlidentical3crows/cdlidentical3crows.html'], function ($html) {

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

                            require(['charts/indicators/highcharts_custom/cdlidentical3crows'], function (cdlidentical3crows) {
                                cdlidentical3crows.init();
                                //Add CDLIDENTICAL3CROWS for the main series
                                $($(".cdlidentical3crows").data('refererChartID')).highcharts().series[0].addCDLIDENTICAL3CROWS();
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

            if ($(".cdlidentical3crows").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cdlidentical3crows").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
