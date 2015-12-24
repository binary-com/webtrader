﻿/**
 * Created by Mahboob.M on 12/20/15.
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['css!charts/indicators/kama/kama.css']);

        require(['text!charts/indicators/kama/kama.html'], function ($html) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            $html.find("#kama_stroke").colorpicker({
                part: {
                    map: { size: 128 },
                    bar: { size: 128 }
                },
                select: function (event, color) {
                    $("#kama_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok: function (event, color) {
                    $("#kama_stroke").css({
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
                            var isValid = true;
                            $(".kama_input_width_for_period").each(function () {
                                if (!isNumericBetween(parseInt($(this).val()), parseInt($(this).attr("min")), parseInt($(this).attr("max")))) {
                                    var $elem = $(this);
                                    require(["jquery", "jquery-growl"], function ($) {
                                        $.growl.error({
                                            message: "Only numbers between " + $elem.attr("min")
                                                    + " to " + $elem.attr("max")
                                                    + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
                                        });
                                    });
                                    isValid = false;
                                    return;
                                }
                            });;

                            if (!isValid) return;

                            require(['charts/indicators/highcharts_custom/kama'], function (kama) {
                                kama.init();
                                var options = {
                                    period: parseInt($html.find("#kama_period").val()),
                                    fastPeriod: parseInt($html.find("#kama_fast_period").val()),
                                    slowPeriod: parseInt($html.find("#kama_slow_period").val()),
                                    stroke: defaultStrokeColor,
                                    strokeWidth: parseInt($html.find("#kama_strokeWidth").val()),
                                    dashStyle: $html.find("#kama_dashStyle").val(),
                                    appliedTo: parseInt($html.find("#kama_appliedTo").val())
                                }
                                //Add KAMA for the main series
                                $($(".kama").data('refererChartID')).highcharts().series[0].addKAMA(options);
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

            if ($(".kama").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".kama").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
