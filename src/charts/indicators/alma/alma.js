/**
 * Created by Mahboob.M on 2/2/16.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/alma/alma.css']);

        require(['text!charts/indicators/alma/alma.html'], function ( $html ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            $html.find("input[type='button']").button();

            $html.find("#alma_stroke").colorpicker({
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
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'alma-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function() {
                            if (!isNumericBetween($html.find("#alma_period").val(),
                                            parseInt($html.find("#alma_period").attr("min")),
                                            parseInt($html.find("#alma_period").attr("max")))) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $html.find("#alma_period").attr("min")
                                                + " to " + $html.find("#alma_period").attr("max")
                                                + " is allowed for " + $html.find("#alma_period").closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                return;
                            };

                            if (!isFloatBetween($html.find("#alma_offset").val(),
                                            parseInt($html.find("#alma_offset").attr("min")),
                                            parseInt($html.find("#alma_offset").attr("max")))) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $html.find("#alma_offset").attr("min")
                                                + " to " + $html.find("#alma_offset").attr("max")
                                                + " is allowed for " + $html.find("#alma_offset").closest('tr').find('td:first').text() + "!"
                                    });
                                });
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
