/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'common/loadCSS'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        loadCSS('charts/indicators/atr/atr.css');

        $.get("charts/indicators/atr/atr.html" , function ( $html ) {
            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            $html.find("#stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                },
                ok:             			function(event, color) {
                    $("#stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                }
            });

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 210,
                buttons: [
                    {
                        text: "Ok",
                        click: function() {
                            //console.log('Ok button is clicked!');
                            require(["validation/validation"], function(validation) {

                                if (!validation.validateNumericBetween($html.find(".atr_input_width_for_period").val(),
                                                parseInt($html.find(".atr_input_width_for_period").attr("min")),
                                                parseInt($html.find(".atr_input_width_for_period").attr("max"))))
                                {
                                    require(["jquery", "jquery-growl"], function($) {
                                        $("#timePeriod").addClass('ui-state-error');
                                        $.growl.error({ message: "Only numbers between " + $html.find(".atr_input_width_for_period").attr("min")
                                                + " to " + $html.find(".atr_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".atr_input_width_for_period").closest('tr').find('td:first').text() + "!" });
                                    });
                                    return;
                                }

                                //TODO
                                require(["charts/charts"], function ( charts ) {
                                        require(['highcharts/indicators/atr'], function () {
                                            var options = {
                                                type: 'atr',
                                                params: {
                                                    period: $html.find(".atr_input_width_for_period").val()
                                                },
                                                styles: {
                                                    strokeWidth: $html.find("#strokeWidth").val(),
                                                    stroke: "'" + $html.find("#stroke").css("background") + "'",
                                                    dashstyle: "'" + $html.find("#dashStyle").val() + "'"
                                                },
                                                yAxis: {
                                                    title: {
                                                        text: 'ATR(' + $html.find(".atr_input_width_for_period").val() + ')'
                                                    }
                                                }
                                            }
                                            charts.addIndicator(containerIDWithHash, options);
                                        });
                                });

                                closeDialog.call($html);

                            });
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

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash ) {

            if ($(".atr").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".atr").dialog( "open" );

        }

    };

});
