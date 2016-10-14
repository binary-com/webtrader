/**
Created By Mahboob.M on 12/12/2015
*/
define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    var before_add_callback = null;

    function closeDialog() {
        $(this).dialog('close');
    }

    function init(containerIDWithHash, _callback) {
        require(['css!charts/indicators/macd/macd.css']);

        require(['text!charts/indicators/macd/macd.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            $html = $($html);

            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.macd;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.macd-description').html(current_indicator_data.description);

            $html.find("#macd_line_stroke,#signal_line_stroke,#macd_hstgrm_color").each(function () {
                $(this).colorpicker({
					showOn: 'click',
                    position: {
                        at: "right+100 bottom",
                        of: "element",
                        collision: "fit"
                    },
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
            $('#macd_dash_style').ddslick({
                imagePosition: "left",
                width: 150,
                background: "white",
                onSelected: function (data) {
                    $('#macd_dash_style .dd-selected-image').css('max-height','5px').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#macd_dash_style .dd-option-image').css('max-height','5px').css('max-width', '115px');

            $("#macd_line_stroke").css("background", '#2a277a');
            $("#signal_line_stroke").css("background", 'red');
            $("#macd_hstgrm_color").css("background", '#7e9fc9');

            $html.dialog({
                autoOpen: false,
                resizable: true,
                width: 350,
                height: 400,
                modal: true,
                my: "center",
                at: "center",
                of: window,
                dialogClass: 'macd-ui-dialog',
                buttons: [
					{
					    text: "OK",
					    click: function () {
					        //Check validation
					        var isValid = true;
					        $(".macd_input_width_for_period").each(function () {
					             var $elem = $(this);
                                 if (!_.isInteger(_.toNumber($elem.val())) || !_.inRange($elem.val(), parseInt($elem.attr("min")), parseInt($elem.attr("max")) + 1)) {
					                require(["jquery", "jquery-growl"], function ($) {
					                    $.growl.error({
					                        message: "Only numbers between " + $elem.attr("min")
                                                    + " to " + $elem.attr("max")
                                                    + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
					                    });
					                });
					                $elem.val($elem.prop("defaultValue"));
					                isValid = false;
					                return;
					            }
					        });

					        if (!isValid) return;


					        var options = {
					            fastPeriod: parseInt($("#macd_fast_period").val()),
					            slowPeriod: parseInt($("#macd_slow_period").val()),
					            signalPeriod: parseInt($("#macd_signal_period").val()),
					            fastMaType: $("#macd_fast_ma_type").val(),
					            slowMaType: $("#macd_slow_ma_type").val(),
					            signalMaType: $("#macd_signal_ma_type").val(),
					            macdStroke: $("#macd_line_stroke").css("background-color"),
					            signalLineStroke: $("#signal_line_stroke").css('background-color'),
					            macdHstgrmColor: $("#macd_hstgrm_color").css('background-color'),
					            strokeWidth: parseInt($("#macd_stroke_width").val()),
					            dashStyle: selectedDashStyle,
					            appliedTo: parseInt($("#macd_applied_to").val())
					        }
                            before_add_callback && before_add_callback();
					        //Add Bollinger for the main series
					        $($(".macd").data('refererChartID')).highcharts().series[0].addIndicator('macd', options);

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
            $html.find('select').each(function(index, value){
                $(value).selectmenu({
                    width : 150
                }).selectmenu("menuWidget").css("max-height","85px");
            });

            if ($.isFunction(_callback)) {
                _callback(containerIDWithHash);
            }

        });
    }

    return {
        open: function (containerIDWithHash, before_add_cb) {
            var open = function() {
                before_add_callback = before_add_cb;
                $(".macd").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".macd").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }
    };
});
