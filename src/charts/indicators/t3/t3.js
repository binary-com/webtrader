/**
Created By Mahboob.M on 12/20/2015
*/
define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/t3/t3.css']);

        require(['text!charts/indicators/t3/t3.html'], function ($html) {

            $html = $($html);

            $html.appendTo("body");

            $html.find("#t3_stroke").each(function () {
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
            $('#t3_dash_style').ddslick({
                imagePosition: "left",
                width: 158,
                background: "white",
                onSelected: function (data) {
                    $('#t3_dash_style .dd-selected-image').css('max-width', '125px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#t3_dash_style .dd-option-image').css('max-width', '125px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                dialogClass: 't3-ui-dialog',
                buttons: [
					{
					    text: "OK",
					    click: function () {
					        //Check validation
					        if (!isNumericBetween($html.find("#t3_period").val(),
                                            parseInt($html.find("#t3_period").attr("min")),
                                            parseInt($html.find("#t3_period").attr("max")))) {
					            require(["jquery", "jquery-growl"], function ($) {
					                $.growl.error({
					                    message: "Only numbers between " + $html.find("#t3_period").attr("min")
                                                + " to " + $html.find("#t3_period").attr("max")
                                                + " is allowed for " + $html.find("#t3_period").closest('tr').find('td:first').text() + "!"
					                });
					            });
					            return;
					        }

					        require(['charts/indicators/highcharts_custom/t3'], function (t3) {
					            t3.init();
					            var options = {
					                period: parseInt($("#t3_period").val()),
					                vFactor: parseFloat($("#t3_volume_factor").val()),
					                stroke: $("#t3_stroke").css("background-color"),
					                strokeWidth: parseInt($("#t3_stroke_width").val()),
					                dashStyle: selectedDashStyle,
					                appliedTo: parseInt($("#t3_applied_to").val())
					            }
					            //Add Bollinger for the main series
					            $($(".t3").data('refererChartID')).highcharts().series[0].addT3(options);
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
            if ($(".t3").length === 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".t3").data('refererChartID', containerIDWithHash).dialog("open");
        }
    };
});