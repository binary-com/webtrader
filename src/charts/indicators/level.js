/**
 * Created by Mahboob.M on 2/7/16.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    var callBackAfterOKPressed = undefined;
    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        var Level = function (level, stroke, strokeWidth, dashStyle) {
            this.level = level;
            this.stroke = stroke;
            this.strokeWidth = strokeWidth;
            this.dashStyle = dashStyle;
        };

        require(['css!charts/indicators/level.css']);

        require(['text!charts/indicators/level.html'], function ( $html ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html).i18n();
            //$html.hide();
            $html.appendTo("body");
            $html.find("input[type='button']").button();

            $html.find("#level_stroke").colorpicker({
				showOn: 'click',
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#level_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#level_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#level_dashStyle').ddslick({
                imagePosition: "left",
                width: 118,
                background: "white",
                onSelected: function (data) {
                    $('#level_dashStyle .dd-selected-image').css('max-height','5px').css('max-width', '85px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#level_dashStyle .dd-option-image').css('max-height','5px').css('max-width', '85px');


            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 280,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'level-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function() {

                            var $elem = $('input.level_input_width_for_level'),                             
                                val = Math.round(_.toNumber($elem.val()) * 10000)/10000;   //Maximum upto 4 decimals rounding
                                                    

                            if (!_.isFinite(val) || !(val >=$elem.attr("min") && val <=$elem.attr("max"))) {
                                require(["jquery", "jquery-growl"], function($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $elem.attr("min") + " to " + $elem.attr("max") + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                $elem.val($elem.prop("defaultValue"));
                                isValid = false;
                                return;
                            }



                            if (callBackAfterOKPressed) {
                                callBackAfterOKPressed([new Level(val,
                                    defaultStrokeColor, parseInt($html.find("#level_strokeWidth").val()),
                                    selectedDashStyle)]);
                            }

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
                width : 120
            });

            if ($.isFunction(_callback))
            {
                _callback( containerIDWithHash, callBackAfterOKPressed );
            }

        });

    }

    return {

        open : function ( containerIDWithHash, _callback ) {

            callBackAfterOKPressed = _callback;
            if ($(".level").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            if (!$(".level").dialog("isOpen"))
                $(".level").dialog("open");

        }

    };

});
