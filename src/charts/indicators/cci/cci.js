/**
Created By Mahboob.M on 12/16/2015
*/

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/cci/cci.css']);

        require(['text!charts/indicators/cci/cci.html'], function ($html) {

            $html = $($html);

            $html.appendTo("body");

            $html.find("#cci_stroke_color").each(function () {
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
            $('#cci_dash_style').ddslick({
                imagePosition: "left",
                width: 148,
                background: "white",
                onSelected: function (data) {
                    $('#cci_dash_style .dd-selected-image').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#cci_dash_style .dd-option-image').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                dialogClass: 'cci-ui-dialog',
                buttons: [
					{
					    text: "OK",
					    click: function () {
                            if (!_.inRange($html.find(".cci_input_width_for_period").val(),
                                            parseInt($html.find(".cci_input_width_for_period").attr("min")),
                                            parseInt($html.find(".cci_input_width_for_period").attr("max")))) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $html.find(".cci_input_width_for_period").attr("min")
                                                + " to " + $html.find(".cci_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".cci_input_width_for_period").closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                return;
                            }

					        var options = {
					            period: parseInt($("#cci_period").val()),
					            maType: $("#cci_ma_type").val(),
					            stroke: $("#cci_stroke_color").css("background-color"),
					            strokeWidth: parseInt($("#cci_stroke_width").val()),
					            dashStyle: selectedDashStyle
					        }
					        //Add CCI to the main series
					        $($(".cci").data('refererChartID')).highcharts().series[0].addIndicator('cci', options);

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
            $html.find('select').selectmenu({
                width : 150
            });

            if ($.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }

        });
    }

    return {
        open: function (containerIDWithHash) {
            if ($(".cci").length === 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".cci").data('refererChartID', containerIDWithHash).dialog("open");
        }
    };
});