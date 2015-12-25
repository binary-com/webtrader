/**
Created By Mahboob.M on 12/22/2015
*/

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/smma/smma.css']);

        require(['text!charts/indicators/smma/smma.html'], function ($html) {

            $html = $($html);

            $html.appendTo("body");

            $html.find("#smma_stroke_color").each(function () {
                $(this).colorpicker({
                    part: {
                        map: { size: 128 },
                        bar: { size: 128 }
                    },
                    select: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                        $(this).data("color", '#' + color.formatted);
                    },
                    ok: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                        $(this).data("color", '#' + color.formatted);
                    }
                });
            });

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                buttons: [
					{
					    text: "OK",
					    click: function () {
					        if (!isNumericBetween($html.find(".smma_input_width_for_period").val(),
                                           parseInt($html.find(".smma_input_width_for_period").attr("min")),
                                           parseInt($html.find(".smma_input_width_for_period").attr("max")))) {
					            require(["jquery", "jquery-growl"], function ($) {
					                $.growl.error({
					                    message: "Only numbers between " + $html.find(".smma_input_width_for_period").attr("min")
                                                + " to " + $html.find(".smma_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".smma_input_width_for_period").closest('tr').find('td:first').text() + "!"
					                });
					            });
					            return;
					        }

					        require(['charts/indicators/highcharts_custom/smma'], function (smma) {
					            smma.init();
					            var options = {
					                period: parseInt($("#smma_period").val()),
					                strokeColor: $("#smma_stroke_color").css("background-color"),
					                strokeWidth: parseInt($("#smma_stroke_width").val()),
					                dashStyle: $("#smma_dash_style").val(),
					                appliedTo: parseInt($html.find("#smma_appliedTo").val())
					            }

					            //Add SMMA to the main series
					            $($(".smma").data('refererChartID')).highcharts().series[0].addSMMA(options);
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
            if ($(".smma").length === 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".smma").data('refererChartID', containerIDWithHash).dialog("open");
        }
    };
});