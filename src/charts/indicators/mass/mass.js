/**
 * Created by Mahboob.M on 2/9/16
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function($) {

    var before_add_callback = null;

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/mass/mass.css']);

        var Level = function (level, stroke, strokeWidth, dashStyle) {
            this.level = level;
            this.stroke = stroke;
            this.strokeWidth = strokeWidth;
            this.dashStyle = dashStyle;
        };
        var defaultLevels = [new Level(30, 'red', 1, 'Dash'), new Level(70, 'red', 1, 'Dash')];

        require(['text!charts/indicators/mass/mass.html', 'text!charts/indicators/indicators.json'], function ( $html, data ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.mass;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.mass-description').html(current_indicator_data.description);

            $html.find("input[type='button']").button();

            $html.find("#mass_stroke").colorpicker({
				showOn: 'click',
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
                    $("#mass_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#mass_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#mass_dashStyle').ddslick({
                imagePosition: "left",
                width: 155,
                background: "white",
                onSelected: function (data) {
                    $('#mass_dashStyle .dd-selected-image').css('max-height','5px').css('max-width', '120px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#mass_dashStyle .dd-option-image').css('max-height','5px').css('max-width', '120px');


            var table = $html.find('#mass_levels').DataTable({
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
            $html.find('#mass_level_delete').click(function () {
                if (table.rows('.selected').indexes().length <= 0) {
                    require(["jquery", "jquery-growl"], function($) {
                        $.growl.error({ message: "Select level(s) to delete!" });
                    });
                } else {
                    table.rows('.selected').remove().draw();
                }
            });
            $html.find('#mass_level_add').click(function () {
                require(["indicator_levels"], function(level) {
                    level.open(containerIDWithHash, function (levels) {
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
                width: 370,
                height: 400,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'mass-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            //Check validation
					        var isValid = true;
					        $(".mass_input_width_for_period").each(function () {
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
                                period: parseInt($("#mass_period").val()),
                                singlePeriod: parseInt($("#mass_single_period").val()),
                                doublePeriod: parseInt($("#mass_double_period").val()),
                                singleMaType: $("#mass_single_ma_type").val(),
                                doubleMaType: $("#mass_double_ma_type").val(),
                                stroke: defaultStrokeColor,
                                strokeWidth: parseInt($("#mass_stroke_width").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($("#mass_applied_to").val()),
                                levels:levels
                            }
                            before_add_callback && before_add_callback();
                            //Add MASS for the main series
                            $($(".mass").data('refererChartID')).highcharts().series[0].addIndicator('mass', options);

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
            $html.find('select').each(function(index, value){
                $(value).selectmenu({
                    width : 155
                }).selectmenu("menuWidget").css("max-height","85px");
            });

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash, before_add_cb ) {
            var open = function() {
                before_add_callback = before_add_cb;
                $(".mass").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".mass").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }

    };

});
