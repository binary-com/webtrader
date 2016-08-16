/**
Created By Mahboob.M on 24/11/2015
*/

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    var before_add_callback = null;

	function closeDialog()
	{
		$(this).dialog('close');
	}

	function init(containerIDWithHash, _callback)
	{ 
		require(['css!charts/indicators/bbands/bbands.css']);

		require(['text!charts/indicators/bbands/bbands.html', 'text!charts/indicators/indicators.json'], function ( $html, data ) {	
			
			$html = $($html);

			$html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.bbands;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.bbands-description').html(current_indicator_data.description);

            $html.find("#bbands_mdl_stroke,#bbands_up_stroke,#bbands_lwr_stroke").each(function(){
   				 $(this).colorpicker({
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
                    open: function (event, color) {
                        color.colorPicker.setColor($(this).css("background-color"));
                    },
	                select:	function(event, color) {
	                    $(this).css({
	                        background:'#' + color.formatted
	                    }).val('');
	                    $(this).data("color",'#' + color.formatted);
	                },
	                ok:function(event, color) {
	                    $(this).css({
	                        background: '#' + color.formatted
	                    }).val('');
	                    $(this).data("color",'#' + color.formatted);
	                }
   				 });
            });

            $html.find("#bbands_background").colorpicker({
						showOn: 'click',
                alpha: true,
                colorFormat: 'RGBA',
                position: {
                    at: "right+100 bottom",
                    of: "element",
                    collision: "fit"
                },
                part: {
                    map: { size: 128 },
                    bar: { size: 128 }
                },
                open: function (event, color) {
                    color.colorPicker.setColor($(this).css("background-color"));
                },
                select: function (event, color) {
                    $(this).css({
                        background: color.formatted
                    }).val('');
                },
                ok: function (event, color) {
                    $(this).css({
                        background: color.formatted
                    }).val('');
                }
            });

            var selectedDashStyle = "Solid";
            $('#bbands_dashStyle').ddslick({
                imagePosition: "left",
                width: 148,
                background: "white",
                onSelected: function (data) {
                    $('#bbands_dashStyle .dd-selected-image').css('max-height','5px').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#bbands_dashStyle .dd-option-image').css('max-height','5px').css('max-width', '115px');

            
			$html.dialog({
				autoOpen:false,
				resizable:false,
				width:350,
                height:400,
				modal:true,
				my:"center",
				at:"center",
				of: window,
				dialogClass: 'bbands-ui-dialog',
				buttons:[
					{
						text: "OK",
						click: function() {
							   var $elem = $(".bbands_input_width_for_period");
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

                                var options = {
                                    period : parseInt($("#bbands_time_period").val()),
                                    devUp:parseInt($("#bbands_dev_up").val()),
                                    devDn:parseInt($("#bbands_dev_dn").val()),
                                    maType:$("#bbands_ma_type").val(),
                                    mdlBndStroke : $("#bbands_mdl_stroke").css("background-color"),
                                    uprBndStroke : $("#bbands_up_stroke").css('background-color'),
                                    lwrBndStroke: $("#bbands_lwr_stroke").css('background-color'),
                                    backgroundColor:$("#bbands_background").css("background-color"),
                                    strokeWidth : parseInt($("#bbands_strokeWidth").val()),
                                    dashStyle: selectedDashStyle,
                                    appliedTo: parseInt($("#bbands_appliedTo").val())
                                }
                                before_add_callback && before_add_callback();
                                //Add Bollinger for the main series
                                $($(".bbands").data('refererChartID')).highcharts().series[0].addIndicator('bbands', options);

                            closeDialog.call($html);
						}
                    },
					{
						text: "Cancel",
						click:function() {
							closeDialog.call(this);
						}
					}
				]
			});
			$html.find('select').selectmenu({
				width : 150
			});

            if ($.isFunction(_callback))
            {
                _callback( containerIDWithHash );
            }

		});
	}

	return{
		open : function(containerIDWithHash, before_add_cb){
            var open = function() {
                before_add_callback = before_add_cb;
                $(".bbands").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".bbands").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
 		}
	};
});
