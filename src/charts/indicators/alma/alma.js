/**
 * Created by Mahboob.M on 2/2/16.
 */

define(["jquery", "common/rivetsExtra", "jquery-ui", 'color-picker', 'lodash', 'ddslick'], function ($, rv) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/alma/alma.css']);

        require(['text!charts/indicators/alma/alma.html', 'text!charts/indicators/indicators.json'], function ( $html, data ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.alma;
            var state = {
                "title": current_indicator_data.long_display_name,
                "description": current_indicator_data.description
            }
            rv.bind($html[0], state);

            $html.find("input[type='button']").button();

            $html.find("#alma_stroke").colorpicker({
                position: {
                    at: "right+100 bottom",
                    of: "element",
                    collision: "fit"
                },
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#alma_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#alma_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });
            var selectedDashStyle = "Solid";
            $('#alma_dashStyle').ddslick({
                imagePosition: "left",
                width: 138,
                background: "white",
                onSelected: function (data) {
                    $('#alma_dashStyle .dd-selected-image').css('max-width', '105px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#alma_dashStyle .dd-option-image').css('max-width', '105px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                modal: true,
                width: 350,
                height: 400,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'alma-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function() {
                            var isValid = true;
                            $("#alma_period,#alma_sigma").each(function () {
                                var $elem = $(this);
					            if (!_.isInteger(_.toNumber($elem.val())) || !_.inRange($elem.val(), parseInt($elem.attr("min")), parseInt($elem.attr("max")) + 1)) {
					                require(["jquery", "jquery-growl"], function ($) {
					                    $.growl.error({
					                        message: "Only numbers between " + $elem.attr("min")
                                                    + " to " + $elem.attr("max")
                                                    + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
					                    });
					                });
					                isValid = false;
					                $elem.val($elem.prop("defaultValue"));
					                return;
					            }
					        });
					        if (!isValid) return;
					        var $elem=$html.find("#alma_offset");
                            if (!_.inRange($elem.val(),
                                            parseInt($elem.attr("min")),
                                            parseInt($elem.attr("max")) +.01)) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $elem.attr("min")
                                                + " to " + $elem.attr("max")
                                                + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                $elem.val($elem.prop("defaultValue"));
                                return;
                            };

                            var options = {
                                period: parseInt($html.find("#alma_period").val()),
                                sigma: parseInt($html.find("#alma_sigma").val()),
                                offset: parseFloat($html.find("#alma_offset").val()),
                                stroke : defaultStrokeColor,
                                strokeWidth : parseInt($html.find("#alma_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find("#alma_appliedTo").val())
                            }
                            //Add ALMA for the main series
                            $($(".alma").data('refererChartID')).highcharts().series[0].addIndicator('alma', options);

                            closeDialog.call($html);
                        }
                    },
                    {
                        text: "Cancel",
                        click: function() {
                            closeDialog.call(this);
                        }
                    }
                ]
            });
            $html.find('select').selectmenu({
                width : 140
            });

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash ) {

            if ($(".alma").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".alma").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
