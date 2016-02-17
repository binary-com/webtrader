/**
Created By Mahboob.M on 2/1/2015
*/
define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/ppo/ppo.css']);

        require(['text!charts/indicators/ppo/ppo.html'], function ($html) {

            $html = $($html);

            $html.appendTo("body");

            $html.find("#ppo_line_stroke,#signal_line_stroke,#ppo_hstgrm_color").each(function () {
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
            $('#ppo_dash_style').ddslick({
                imagePosition: "left",
                width: 148,
                background: "white",
                onSelected: function (data) {
                    $('#ppo_dash_style .dd-selected-image').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#ppo_dash_style .dd-option-image').css('max-width', '115px');

            $("#ppo_line_stroke").css("background", '#2a277a');
            $("#signal_line_stroke").css("background", 'red');
            $("#ppo_hstgrm_color").css("background", '#7e9fc9');

            $html.dialog({
                autoOpen: false,
                resizable: true,
                width: 390,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                dialogClass: 'ppo-ui-dialog',
                buttons: [
					{
					    text: "OK",
					    click: function () {
					        //Check validation
					        var isValid = true;
					        $(".ppo_input_width_for_period").each(function () {
					            if (!_.inRange($(this).val(), parseInt($(this).attr("min")), parseInt($(this).attr("max")))) {
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


					        var options = {
					            fastPeriod: parseInt($("#ppo_fast_period").val()),
					            slowPeriod: parseInt($("#ppo_slow_period").val()),
					            signalPeriod: parseInt($("#ppo_signal_period").val()),
					            fastMaType: $("#ppo_fast_ma_type").val(),
					            slowMaType: $("#ppo_slow_ma_type").val(),
					            signalMaType: $("#ppo_signal_ma_type").val(),
					            ppoStroke: $("#ppo_line_stroke").css("background-color"),
					            signalLineStroke: $("#signal_line_stroke").css('background-color'),
					            ppoHstgrmColor: $("#ppo_hstgrm_color").css('background-color'),
					            strokeWidth: parseInt($("#ppo_stroke_width").val()),
					            dashStyle: selectedDashStyle,
					            appliedTo: parseInt($("#ppo_applied_to").val())
					        }
					        //Add Bollinger for the main series
					        $($(".ppo").data('refererChartID')).highcharts().series[0].addIndicator('ppo', options);

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
            if ($(".ppo").length === 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".ppo").data('refererChartID', containerIDWithHash).dialog("open");
        }
    };
});