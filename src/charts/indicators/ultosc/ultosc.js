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

        require(['css!charts/indicators/ultosc/ultosc.css']);

        var Level = function (level, stroke, strokeWidth, dashStyle) {
            this.level = level;
            this.stroke = stroke;
            this.strokeWidth = strokeWidth;
            this.dashStyle = dashStyle;
        };
        var defaultLevels = [new Level(30, 'red', 1, 'Dash'), new Level(70, 'red', 1, 'Dash')];

        require(['text!charts/indicators/ultosc/ultosc.html', 'text!charts/indicators/indicators.json'], function ( $html, data ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.ultosc;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.ultosc-description').html(current_indicator_data.description);

            $html.find("input[type='button']").button();

            $html.find("#ultosc_stroke").colorpicker({
				showOn: 'click',
                position: {
                    at: "right+100 bottom",
                    of: "element",
                    collision: "fit"
                },
                part:   {
                    map:        { size: 128 },
                    bar:        { size: 128 }
                },
                select:         function(event, color) {
                    $("#ultosc_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:                         function(event, color) {
                    $("#ultosc_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#ultosc_dashStyle').ddslick({
                imagePosition: "left",
                width: 148,
                background: "white",
                onSelected: function (data) {
                    $('#ultosc_dashStyle .dd-selected-image').css('max-height','5px').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#ultosc_dashStyle .dd-option-image').css('max-height','5px').css('max-width', '115px');


            var table = $html.find('#ultosc_levels').DataTable({
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
            $html.find('#ultosc_level_delete').click(function () {
                if (table.rows('.selected').indexes().length <= 0) {
                    require(["jquery", "jquery-growl"], function($) {
                        $.growl.error({ message: "Select level(s) to delete!" });
                    });
                } else {
                    table.rows('.selected').remove().draw();
                }
            });
            $html.find('#ultosc_level_add').click(function () {
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
                width: 350,
                height: 400,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'ultosc-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            //Check validation
                            var isValid = true;
                            $(".ultosc_input_width_for_period").each(function () {
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

                            //Bug Fix:- https://trello.com/c/1hIogAJe/87-ultimate-oscillator-ultosc-https-www-tradingtechnologies-com-help-xstudy-ultimate-oscillator-ultosc
                            var firstPeriod= parseInt($("#ultosc_first_period").val()),
                                secondPeriod= parseInt($("#ultosc_second_period").val()),
                                thirdPeriod= parseInt($("#ultosc_third_period").val());

                               if (firstPeriod > thirdPeriod) {
                                var $firstPeriod=$("#ultosc_first_period");
                                    require(["jquery", "jquery-growl"], function ($) {
                                        $.growl.error({
                                            message: " Period 1 cannot be more than Period 3" + "!"
                                        });
                                    });
                                   
                                    isValid = false;
                                    return;
                                }  

                                if (secondPeriod > thirdPeriod) {
                                var $secondPeriod=$("#ultosc_first_period");
                                    require(["jquery", "jquery-growl"], function ($) {
                                        $.growl.error({
                                            message: " Period 2 cannot be more than Period 3" + "!"
                                        });
                                    });
                                    isValid = false;
                                    return;
                                }   


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
                                firstPeriod: parseInt($("#ultosc_first_period").val()),
                                secondPeriod: parseInt($("#ultosc_second_period").val()),
                                thirdPeriod: parseInt($("#ultosc_third_period").val()),
                                stroke: defaultStrokeColor,
                                strokeWidth: parseInt($("#ultosc_stroke_width").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($("#ultosc_applied_to").val()),
                                levels:levels
                            }
                            before_add_callback && before_add_callback();
                            //Add ULTOSC for the main series
                            $($(".ultosc").data('refererChartID')).highcharts().series[0].addIndicator('ultosc', options);

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
                $(".ultosc").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".ultosc").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }

    };

});
