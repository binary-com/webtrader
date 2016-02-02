/**
Created By Mahboob.M on 12/22/2015
*/

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/lwma/lwma.css']);

        require(['text!charts/indicators/lwma/lwma.html'], function ($html) {

            $html = $($html);

            $html.appendTo("body");

            $html.find("#lwma_stroke_color").each(function () {
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

            var selectedDashStyle = "Solid";
            $('#lwma_dash_style').ddslick({
                imagePosition: "left",
                width: 148,
                background: "white",
                onSelected: function (data) {
                    $('#lwma_dash_style .dd-selected-image').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#lwma_dash_style .dd-option-image').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                dialogClass: 'lwma-ui-dialog',
                buttons: [
					{
					    text: "OK",
					    click: function () {
					        if (!isNumericBetween($html.find(".lwma_input_width_for_period").val(),
                                          parseInt($html.find(".lwma_input_width_for_period").attr("min")),
                                          parseInt($html.find(".lwma_input_width_for_period").attr("max")))) {
					            require(["jquery", "jquery-growl"], function ($) {
					                $.growl.error({
					                    message: "Only numbers between " + $html.find(".lwma_input_width_for_period").attr("min")
                                                + " to " + $html.find(".lwma_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".lwma_input_width_for_period").closest('tr').find('td:first').text() + "!"
					                });
					            });
					            return;
					        }

					        var options = {
					            period: parseInt($("#lwma_period").val()),
					            stroke: $("#lwma_stroke_color").css("background-color"),
					            strokeWidth: parseInt($("#lwma_stroke_width").val()),
					            dashStyle: selectedDashStyle,
					            appliedTo: parseInt($html.find("#lwma_appliedTo").val())
					        }

					        //Add LWMA to the main series
					        $($(".lwma").data('refererChartID')).highcharts().series[0].addIndicator('lwma', options);

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
            $html.find('select').selectmenu();

            if ($.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }

        });
    }

    return {
        open: function (containerIDWithHash) {
            if ($(".lwma").length === 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".lwma").data('refererChartID', containerIDWithHash).dialog("open");
        }
    };
});