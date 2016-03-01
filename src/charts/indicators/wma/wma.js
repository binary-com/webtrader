/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/wma/wma.css']);

        require(['text!charts/indicators/wma/wma.html'], function ( $html ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            $html.find("input[type='button']").button();

            $html.find("#wma_stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#wma_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#wma_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#wma_dashStyle').ddslick({
                imagePosition: "left",
                width: 138,
                background: "white",
                onSelected: function (data) {
                    $('#wma_dashStyle .dd-selected-image').css('max-width', '105px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#wma_dashStyle .dd-option-image').css('max-width', '105px');

            $html.dialog({
                autoOpen: false,
                resizable: false,
                modal: true,
                width: 350,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'wma-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function() {
                            var $elem = $(".wma_input_width_for_period");
                            if (!_.isInteger(_.toNumber($elem.val())) || !_.inRange($elem.val(),
                                            parseInt($elem.attr("min")),
                                            parseInt($elem.attr("max")) + 1)) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $elem.attr("min")
                                                + " to " + $elem.attr("max")
                                                + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                return;
                            };

                            var options = {
                                period : parseInt($html.find(".wma_input_width_for_period").val()),
                                stroke : defaultStrokeColor,
                                strokeWidth : parseInt($html.find("#wma_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find("#wma_appliedTo").val())
                            }
                            //Add WMA for the main series
                            $($(".wma").data('refererChartID')).highcharts().series[0].addIndicator('wma', options);

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

            if ($(".wma").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".wma").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
