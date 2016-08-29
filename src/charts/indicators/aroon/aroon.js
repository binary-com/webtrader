/**
 * Created by Mahboob.M on 2/3/16.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function($) {

    var before_add_callback = null;

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/aroon/aroon.css']);

        var Level = function (level, stroke, strokeWidth, dashStyle) {
            this.level = level;
            this.stroke = stroke;
            this.strokeWidth = strokeWidth;
            this.dashStyle = dashStyle;
        };
        var defaultLevels = [new Level(30, 'red', 1, 'Dash'), new Level(70, 'red', 1, 'Dash')];

        require(['text!charts/indicators/aroon/aroon.html', 'text!charts/indicators/indicators.json'], function ( $html, data ) {

            var defaultUpStrokeColor = '#57a125';
            var defaultDownStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.aroon;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.aroon-description').html(current_indicator_data.description);

            $html.find("input[type='button']").button();

            $html.find("#aroon_up_stroke").colorpicker({
				showOn: 'click',
                position: {
                    at: "right+100 bottom",
                    of: "element",
                    collision: "fit"
                },
                part: {
                    map: { size: 128 },
                    bar: { size: 128 }
                },
                select: function (event, color) {
                    $("#aroon_up_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultUpStrokeColor = '#' + color.formatted;
                },
                ok: function (event, color) {
                    $("#aroon_up_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultUpStrokeColor = '#' + color.formatted;
                }
            });

            $html.find("#aroon_down_stroke").colorpicker({
						showOn: 'click',
                position: {
                    at: "right+100 bottom",
                    of: "element",
                    collision: "fit"
                },
                part: {
                    map: { size: 128 },
                    bar: { size: 128 }
                },
                select: function (event, color) {
                    $("#aroon_down_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultDownStrokeColor = '#' + color.formatted;
                },
                ok: function (event, color) {
                    $("#aroon_down_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultDownStrokeColor = '#' + color.formatted;
                }
            });


            var selectedDashStyle = "Solid";
            $('#aroon_dashStyle').ddslick({
                imagePosition: "left",
                width: 150,
                background: "white",
                onSelected: function (data) {
                    $('#aroon_dashStyle .dd-selected-image').css('max-height','5px').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#aroon_dashStyle .dd-option-image').css('max-height','5px').css('max-width', '115px');


            var table = $html.find('#aroon_levels').DataTable({
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
            $html.find('#aroon_level_delete').click(function () {
                if (table.rows('.selected').indexes().length <= 0) {
                    require(["jquery", "jquery-growl"], function($) {
                        $.growl.error({ message: "Select level(s) to delete!" });
                    });
                } else {
                    table.rows('.selected').remove().draw();
                }
            });
            $html.find('#aroon_level_add').click(function () {
                require(["indicator_levels"], function(aroon_level) {
                    aroon_level.open(containerIDWithHash, function (levels) {
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
                height: 400,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass:'aroon-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function() {
                            var $elem = $(".aroon_input_width_for_period");
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
                                $elem.val($elem.prop("defaultValue"));
                                return;
                            };

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
                                period: parseInt($html.find(".aroon_input_width_for_period").val()),
                                aroonUpStroke: defaultUpStrokeColor,
                                aroonDownStroke: defaultDownStrokeColor,
                                strokeWidth: parseInt($html.find("#aroon_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                                levels: levels
                            };
                            before_add_callback && before_add_callback();
                            //Add AROON for the main series
                            $($(".aroon").data('refererChartID')).highcharts().series[0].addIndicator('aroon', options);

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
            $html.find('select').each(function(index, value){
                $(value).selectmenu({
                    width : 150
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
                $(".aroon").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".aroon").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }

    };

});
