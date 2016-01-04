/**
 * Created by Mahboob.M on 12/21/15.
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['css!charts/indicators/mama/mama.css']);

        require(['text!charts/indicators/mama/mama.html'], function ($html) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);

            $html.appendTo("body");

            $html.find("input[type='button']").button();

            $html.find("#mama_stroke").colorpicker({
                part: {
                    map: { size: 128 },
                    bar: { size: 128 }
                },
                select: function (event, color) {
                    $("#mama_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok: function (event, color) {
                    $("#mama_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 335,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            require(['charts/indicators/highcharts_custom/mama'], function (mama) {
                                mama.init();
                                var options = {
                                    fastLimit: parseFloat($html.find("#mama_fast_limit").val()),
                                    slowLimt: parseFloat($html.find("#mama_slow_limit").val()),
                                    stroke: defaultStrokeColor,
                                    strokeWidth: parseInt($html.find("#mama_strokeWidth").val()),
                                    dashStyle: $html.find("#mama_dashStyle").val(),
                                    appliedTo: parseInt($html.find("#mama_appliedTo").val())
                                }
                                //Add MAMA for the main series
                                $($(".mama").data('refererChartID')).highcharts().series[0].addMAMA(options);
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

            if ($(".mama").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".mama").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});