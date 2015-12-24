﻿/**
 * Created by Mahboob.M on 12/20/15.
 */

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['css!charts/indicators/dema/dema.css']);

        require(['text!charts/indicators/dema/dema.html'], function ($html) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            $html.find("#dema_stroke").colorpicker({
                part: {
                    map: { size: 128 },
                    bar: { size: 128 }
                },
                select: function (event, color) {
                    $("#dema_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok: function (event, color) {
                    $("#dema_stroke").css({
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

                            if (!isNumericBetween($html.find(".dema_input_width_for_period").val(),
                                            parseInt($html.find(".dema_input_width_for_period").attr("min")),
                                            parseInt($html.find(".dema_input_width_for_period").attr("max")))) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $html.find(".dema_input_width_for_period").attr("min")
                                                + " to " + $html.find(".dema_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".dema_input_width_for_period").closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                return;
                            }

                            require(['charts/indicators/highcharts_custom/dema'], function (dema) {
                                dema.init();
                                var options = {
                                    period: parseInt($html.find(".dema_input_width_for_period").val()),
                                    stroke: defaultStrokeColor,
                                    strokeWidth: parseInt($html.find("#dema_strokeWidth").val()),
                                    dashStyle: $html.find("#dema_dashStyle").val(),
                                    appliedTo: parseInt($html.find("#dema_appliedTo").val())
                                }
                                //Add DEMA for the main series
                                $($(".dema").data('refererChartID')).highcharts().series[0].addDEMA(options);
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

            if ($(".dema").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".dema").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});
