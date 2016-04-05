/**
 * Created by Mahboob.M on 12/21/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'lodash', 'ddslick'], function ($) {

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

            var selectedDashStyle = "Solid";
            $('#mama_dashStyle').ddslick({
                imagePosition: "left",
                width: 148,
                background: "white",
                onSelected: function (data) {
                    $('#mama_dashStyle .dd-selected-image').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#mama_dashStyle .dd-option-image').css('max-width', '115px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 335,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'mama-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            //Check validation
					        var isValid = true;
					        $(".mama_input_width_for_period").each(function () {
					            if (!_.inRange($(this).val(), parseInt($(this).attr("min")), parseInt($(this).attr("max")) +.01)) {
					                var $elem = $(this);
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
                                fastLimit: parseFloat($html.find("#mama_fast_limit").val()),
                                slowLimt: parseFloat($html.find("#mama_slow_limit").val()),
                                stroke: defaultStrokeColor,
                                strokeWidth: parseInt($html.find("#mama_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find("#mama_appliedTo").val())
                            }
                            //Add MAMA for the main series
                            $($(".mama").data('refererChartID')).highcharts().series[0].addIndicator('mama', options);

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

            if ($(".mama").length == 0) {
                init(containerIDWithHash, this.open);
                return;
            }

            $(".mama").data('refererChartID', containerIDWithHash).dialog("open");

        }

    };

});