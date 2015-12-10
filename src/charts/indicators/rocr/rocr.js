/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/rocr/rocr.css']);

        var Level = function (level, stroke, strokeWidth, dashStyle) {
            this.level = level;
            this.stroke = stroke;
            this.strokeWidth = strokeWidth;
            this.dashStyle = dashStyle;
        };
        var defaultLevels = [];

        require(['text!charts/indicators/rocr/rocr.html'], function ( $html ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            $html.find("#rocr_stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#rocr_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#rocr_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var table = $html.find('#rocr_levels').DataTable({
                paging: false,
                scrollY: 100,
                autoWidth: true,
                searching: false,
                info: false
            });
            $.each(defaultLevels, function (index, value) {
                $(table.row.add([value.level, '<div style="background-color: ' + value.stroke + ';width:100%;height:20px;"></div>', value.strokeWidth, value.dashStyle]).draw().node())
                    .data("level", value)
                    .on('click', function () {
                        $(this).toggleClass('selected');
                    } );
            });
            $html.find('#rocr_level_delete').click(function () {
                if (table.rows('.selected').indexes().length <= 0) {
                    require(["jquery", "jquery-growl"], function($) {
                        $.growl.error({ message: "Select levels to delete!" });
                    });
                } else {
                    table.rows('.selected').remove().draw();
                }
            });
            $html.find('#rocr_level_add').click(function () {
                require(["charts/indicators/rocr/rocr_level"], function(rocr_level) {
                    rocr_level.open(containerIDWithHash, function (levels) {
                        $.each(levels, function (ind, value) {
                            $(table.row.add([value.level, '<div style="background-color: ' + value.stroke + ';width:100%;height:20px;"></div>', value.strokeWidth, value.dashStyle]).draw().node())
                                .data("level", value)
                                .on('click', function () {
                                    $(this).toggleClass('selected');
                                } );
                        });
                    });
                });
            });


            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                buttons: [
                    {
                        text: "OK",
                        click: function() {

                            if (!isNumericBetween($html.find(".rocr_input_width_for_period").val(),
                                            parseInt($html.find(".rocr_input_width_for_period").attr("min")),
                                            parseInt($html.find(".rocr_input_width_for_period").attr("max"))))
                            {
                                require(["jquery", "jquery-growl"], function($) {
                                    $.growl.error({ message: "Only numbers between " + $html.find(".rocr_input_width_for_period").attr("min")
                                            + " to " + $html.find(".rocr_input_width_for_period").attr("max")
                                            + " is allowed for " + $html.find(".rocr_input_width_for_period").closest('tr').find('td:first').text() + "!" });
                                });
                                return;
                            }

                            require(['charts/indicators/highcharts_custom/rocr'], function ( rocr ) {
                                rocr.init();
                                var levels = [];
                                $.each(table.rows().nodes(), function () {
                                    var data = $(this).data('level');
                                    if (data) {
                                        levels.push({
                                            color: data.stroke,
                                            dashStyle: data.dashStyle,
                                            width: data.strokeWidth,
                                            value: data.level,
                                            label: {
                                                text: data.level
                                            }
                                        });
                                    }
                                });
                                var options = {
                                    period : parseInt($html.find(".rocr_input_width_for_period").val()),
                                    stroke : defaultStrokeColor,
                                    strokeWidth : parseInt($html.find("#rocr_strokeWidth").val()),
                                    dashStyle : $html.find("#rocr_dashStyle").val(),
                                    levels : levels
                                };
                                //Add ROCR for the main series
                                $($(".rocr").data('refererChartID')).highcharts().series[0].addROCR(options);
                            });

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

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash ) {

            if ($(".rocr").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".rocr").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
