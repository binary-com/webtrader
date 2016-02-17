/**
 * Created by Mahboob.M on 2/3/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/cks/cks.css']);

        require(['text!charts/indicators/cks/cks.html'], function ( $html ) {

            var defaultShortStroke = '#cd0a0a';
            var defaultLongStroke = '#57a125';

            $html = $($html);
            $html.appendTo("body");
            $html.find("input[type='button']").button();

            $html.find("#cks_short_stop_stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#cks_short_stop_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultShortStroke = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#cks_short_stop_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultShortStroke = '#' + color.formatted;
                }
            });

            $html.find("#cks_long_stop_stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#cks_long_stop_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultLongStroke = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#cks_long_stop_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultLongStroke = '#' + color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#cks_dashStyle').ddslick({
                imagePosition: "left",
                width: 158,
                background: "white",
                onSelected: function (data) {
                    $('#cks_dashStyle .dd-selected-image').css('max-width', '125px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#cks_dashStyle .dd-option-image').css('max-width', '125px');


            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 315,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'cks-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function() {

                             //Check validation
					        var isValid = true;
					        $(".cks_input_width_for_period").each(function () {
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
                                period: parseInt($html.find("#cks_period").val()),
                                maxMinPeriod: parseInt($html.find("#cks_max_min_period").val()),
                                multiplier : parseInt($html.find("#cks_multiplier").val()),
                                shortStopStroke: defaultShortStroke,
                                longStopStroke : defaultLongStroke,
                                strokeWidth : parseInt($html.find("#cks_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                            }
                            //Add CKS for the main series
                            $($(".cks").data('refererChartID')).highcharts().series[0].addIndicator('cks', options);

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
                width : 160
            });

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash ) {

            if ($(".cks").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".cks").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
