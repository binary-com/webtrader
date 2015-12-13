/**
Created By Mahboob.M on 24/11/2015
*/

define(["jquery", "jquery-ui", 'color-picker'], function($) {

	function closeDialog()
	{
		$(this).dialog('close');
	}

	function init(containerIDWithHash, _callback)
	{ 
		require(['css!charts/indicators/bbands/bbands.css']);

		require(['text!charts/indicators/bbands/bbands.html'], function ( $html ) {	
			
			$html = $($html);

			$html.appendTo("body");

            $html.find("#bbands_mdl_stroke,#bbands_up_stroke,#bbands_lwr_stroke").each(function(){
   				 $(this).colorpicker({
	                part:	{
	                    map:		{ size: 128 },
	                    bar:		{ size: 128 }
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
            
			$html.dialog({
				autoOpen:false,
				resizable:false,
				width:350,
				modal:true,
				my:"center",
				at:"center",
				of:window,
				buttons:[
					{
						text: "OK",
						click: function() {
							    //Check validation
							    if (!isNumericBetween($html.find(".bbands_input_width_for_period").val(),
                                            parseInt($html.find(".bbands_input_width_for_period").attr("min")),
                                            parseInt($html.find(".bbands_input_width_for_period").attr("max")))) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $html.find(".bbands_input_width_for_period").attr("min")
                                                + " to " + $html.find(".bbands_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".bbands_input_width_for_period").closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                return;
                            	}

							    require(['charts/indicators/highcharts_custom/bbands'], function ( bbands ) {
                                bbands.init();
                                var options = {
                                    period : parseInt($("#bbands_time_period").val()),
                                    devUp:parseInt($("#bbands_dev_up").val()),
                                    devDn:parseInt($("#bbands_dev_dn").val()),
                                    maType:$("#bbands_ma_type").val(),
                                    mdlBndStroke : $("#bbands_mdl_stroke").css("background-color"),
                                    uprBndStroke : $("#bbands_up_stroke").css('background-color'),
                                    lwrBndStroke : $("#bbands_lwr_stroke").css('background-color'),
                                    strokeWidth : parseInt($("#bbands_strokeWidth").val()),
                                    dashStyle : $("#bbands_dashStyle").val(),
                                    appliedTo: parseInt($("#bbands_appliedTo").val())
                                }
                                //Add Bollinger for the main series
                                $($(".bbands").data('refererChartID')).highcharts().series[0].addBBANDS(options);
                            });

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

            if ($.isFunction(_callback))
            {
                _callback( containerIDWithHash );
            }

		});
	}

	return{
		open : function(containerIDWithHash){
 			if ($(".bbands").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".bbands").data('refererChartID', containerIDWithHash).dialog( "open" );
 		}
	};
});