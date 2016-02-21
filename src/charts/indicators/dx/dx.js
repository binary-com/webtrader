/**
 * Created by Mahboob.M on 2/6/16.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/dx/dx.css']);

        var Level = function (level, stroke, strokeWidth, dashStyle) {
            this.level = level;
            this.stroke = stroke;
            this.strokeWidth = strokeWidth;
            this.dashStyle = dashStyle;
        };
        var defaultLevels = [new Level(0.3, 'red', 1, 'Dash'), new Level(0.7, 'red', 1, 'Dash')];

        require(['text!charts/indicators/dx/dx.html'], function ( $html ) {

            var dxStroke = '#0026ff', plusDIStroke = '#00ff21', minusDIStroke = '#ff0000';

            $html = $($html);
            $html.appendTo("body");
            $html.find("input[type='button']").button();

            $(".dx_stroke").each(function () {
                $(this).colorpicker({
                    part: {
                        map: { size: 128 },
                        bar: { size: 128 }
                    },
                    select: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                        if ($(this).attr('id') === 'adx')
                            dxStroke = '#' + color.formatted;
                        else if ($(this).attr('id') === 'plus')
                            plusDIStroke = '#' + color.formatted;
                        else if ($(this).attr('id') === 'minus')
                            minusDIStroke = '#' + color.formatted;
                    },
                    ok: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                         if ($(this).attr('id') === 'adx')
                            dxStroke = '#' + color.formatted;
                        else if ($(this).attr('id') === 'plus')
                            plusDIStroke = '#' + color.formatted;
                        else if ($(this).attr('id') === 'minus')
                            minusDIStroke = '#' + color.formatted;
                    }
                });
            });

            var selectedDashStyle = "Solid";
            $('#dx_dashStyle').ddslick({
                imagePosition: "left",
                width: 158,
                background: "white",
                onSelected: function (data) {
                    $('#dx_dashStyle .dd-selected-image').css('max-width', '125px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#dx_dashStyle .dd-option-image').css('max-width', '125px');


            var table = $html.find('#dx_levels').DataTable({
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
            $html.find('#dx_level_delete').click(function () {
                if (table.rows('.selected').indexes().length <= 0) {
                    require(["jquery", "jquery-growl"], function($) {
                        $.growl.error({ message: "Select levels to delete!" });
                    });
                } else {
                    table.rows('.selected').remove().draw();
                }
            });
            $html.find('#dx_level_add').click(function () {
                require(["charts/indicators/level/level"], function(dx_level) {
                    dx_level.open(containerIDWithHash, function (levels) {
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
                width: 450,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass:'dx-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function() {
                            if (!_.inRange($html.find(".dx_input_width_for_period").val(),
                                            parseInt($html.find(".dx_input_width_for_period").attr("min")),
                                            parseInt($html.find(".dx_input_width_for_period").attr("max")))) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $html.find(".dx_input_width_for_period").attr("min")
                                                + " to " + $html.find(".dx_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".dx_input_width_for_period").closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                return;
                            }

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
                                period: parseInt($html.find(".dx_input_width_for_period").val()),
                                maType: $html.find("#dx_ma_type").val(),
                                dxStroke: dxStroke,
                                plusDIStroke: plusDIStroke,
                                minusDIStroke: minusDIStroke,
                                strokeWidth: parseInt($html.find("#dx_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find("#dx_appliedTo").val()),
                                levels: levels
                            };
                            //Add DX for the main series
                            $($(".dx").data('refererChartID')).highcharts().series[0].addIndicator('dx', options);

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

            if ($(".dx").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".dx").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
