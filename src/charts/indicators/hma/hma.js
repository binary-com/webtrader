/**
Created By Mahboob.M on 12/22/2015
*/

define(["jquery", "jquery-ui", 'color-picker'], function ($) {

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/hma/hma.css']);

        require(['text!charts/indicators/hma/hma.html'], function ($html) {

            $html = $($html);

            $html.appendTo("body");

            $html.find("#hma_stroke_color").each(function () {
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
					        if (!isNumericBetween($html.find(".hma_input_width_for_period").val(),
                                           parseInt($html.find(".hma_input_width_for_period").attr("min")),
                                           parseInt($html.find(".hma_input_width_for_period").attr("max")))) {
					            require(["jquery", "jquery-growl"], function ($) {
					                $.growl.error({
					                    message: "Only numbers between " + $html.find(".hma_input_width_for_period").attr("min")
                                                + " to " + $html.find(".hma_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".hma_input_width_for_period").closest('tr').find('td:first').text() + "!"
					                });
					            });
					            return;
					        }

					        require(['charts/indicators/highcharts_custom/hma'], function (hma) {
					            hma.init();
					            var options = {
					                period: parseInt($("#hma_period").val()),
					                maType: $("#hma_ma_type").val(),
					                strokeColor: $("#hma_stroke_color").css("background-color"),
					                strokeWidth: parseInt($("#hma_stroke_width").val()),
					                dashStyle: $("#hma_dash_style").val(),
					                appliedTo: parseInt($html.find("#hma_appliedTo").val())
					            }

					            //Add HMA to the main series
					            $($(".hma").data('refererChartID')).highcharts().series[0].addHMA(options);
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
            if ($(".hma").length === 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".hma").data('refererChartID', containerIDWithHash).dialog("open");
        }
    };
});