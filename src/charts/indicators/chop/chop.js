/**
 * Created by Mahboob.M on 2/6/16.
 */

define(["jquery", "common/rivetsExtra", "jquery-ui", 'color-picker', 'ddslick'], function($, rv) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/chop/chop.css']);

        var Level = function (level, stroke, strokeWidth, dashStyle) {
            this.level = level;
            this.stroke = stroke;
            this.strokeWidth = strokeWidth;
            this.dashStyle = dashStyle;
        };
        var defaultLevels = [new Level(30, 'red', 1, 'Dash'), new Level(70, 'red', 1, 'Dash')];

        require(['text!charts/indicators/chop/chop.html', 'text!charts/indicators/indicators.json'], function ( $html, data ) {

            var defaultStrokeColor = '#cd0a0a';
            var plotColor = 'rgba(178, 191, 217, 0.20)';

            $html = $($html);
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.chop;
            var state = {
                "title": current_indicator_data.long_display_name,
                "description": current_indicator_data.description
            }
            rv.bind($html[0], state);

            $html.find("input[type='button']").button();

            $html.find("#chop_stroke").colorpicker({
                part: {
                    map: { size: 128 },
                    bar: { size: 128 }
                },
                select: function (event, color) {
                    $("#chop_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok: function (event, color) {
                    $("#chop_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            $html.find("#chop_plot_color").colorpicker({
                alpha :true,
                colorFormat:'RGBA',
                part: {
                    map: { size: 128 },
                    bar: { size: 128 }
                },
                select: function (event, color) {
                    $("#chop_plot_color").css({
                        background: color.formatted
                    }).val('');
                    plotColor = color.formatted;
                },
                ok: function (event, color) {
                    $("#chop_plot_color").css({
                        background:  color.formatted
                    }).val('');
                    plotColor = color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#chop_dashStyle').ddslick({
                imagePosition: "left",
                width: 118,
                background: "white",
                onSelected: function (data) {
                    $('#chop_dashStyle .dd-selected-image').css('max-width', '85px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#chop_dashStyle .dd-option-image').css('max-width', '85px');


            var table = $html.find('#chop_levels').DataTable({
                paging: false,
                scrollY: 100,
                autoWidth: true,
                searching: false,
                info: false,
                "columnDefs": [
                   { className: "dt-center", "targets": [0,1,2,3] },
                ],
                "aoColumnDefs": [{ "bSortable": false, "aTargets": [1, 3] }]

            });

            $.each(defaultLevels, function (index, value) {
                $(table.row.add([value.level, '<div style="background-color: ' + value.stroke + ';width:100%;height:20px;"></div>', value.strokeWidth,
                    '<div style="width:50px;overflow:hidden;"><img src="images/dashstyle/' + value.dashStyle + '.svg" /></div>']).draw().node())
                    .data("level", value)
                    .on('click', function () {
                        $(this).toggleClass('selected');
                    });
            });
            $html.find('#chop_level_delete').click(function () {
                if (table.rows('.selected').indexes().length <= 0) {
                    require(["jquery", "jquery-growl"], function($) {
                        $.growl.error({ message: "Select level(s) to delete!" });
                    });
                } else {
                    table.rows('.selected').remove().draw();
                }
            });
            $html.find('#chop_level_add').click(function () {
                require(["indicator_levels"], function(chop_level) {
                    chop_level.open(containerIDWithHash, function (levels) {
                        $.each(levels, function (ind, value) {
                            $(table.row.add([value.level, '<div style="background-color: ' + value.stroke + ';width:100%;height:20px;"></div>', value.strokeWidth,
                                '<div style="width:50px;overflow:hidden;"><img src="images/dashstyle/' + value.dashStyle + '.svg" /></div>']).draw().node())
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
                dialogClass:'chop-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function() {
                           //Check validation
					        var isValid = true;
					        $(".chop_input_width_for_period").each(function () {
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

                            var levels = [];
                            var plotBands = [];
                            var minLevel , maxLevel;
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
                                    maxLevel = maxLevel ? Math.max(data.level, maxLevel) : data.level;
                                    minLevel = minLevel ? Math.min(data.level, minLevel) : data.level;
                                }
                            });
                            if (maxLevel && minLevel) {
                                plotBands.push({
                                    color: plotColor,
                                    from: minLevel,
                                    to: maxLevel
                                });
                            };

                            var options = {
                                period: parseInt($html.find("#chop_period").val()),
                                atrPeriod: parseInt($html.find("#chop_atr_period").val()),
                                stroke: defaultStrokeColor,
                                strokeWidth: parseInt($html.find("#chop_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find('#chop_appliedTo').val()),
                                levels: levels,
                                plotBands: plotBands
                            };
                            //Add CHOP for the main series
                            $($(".chop").data('refererChartID')).highcharts().series[0].addIndicator('chop', options);

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

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash ) {

            if ($(".chop").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".chop").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
