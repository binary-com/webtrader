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
		require(['css!charts/indicators/bllngrbnd/bllngrbnd.css']);

		require(['text!charts/indicators/bllngrbnd/bllngrbnd.html'], function ( $html ) {	
			
			$html = $($html);

			$html.appendTo("body");

            $html.find("#bllngrbnd_mdl_stroke,#bllngrbnd_up_stroke,#bllngrbnd_lwr_stroke").each(function(){
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
				resisable:false,
				width:350,
				modal:true,
				my:"center",
				at:"center",
				of:window,
				buttons:[
					{
						text: "Ok",
						click: function() {
							    //Check validation
							    if (!isNumericBetween($html.find(".bllngrbnd_input_width_for_period").val(),
                                            parseInt($html.find(".bllngrbnd_input_width_for_period").attr("min")),
                                            parseInt($html.find(".bllngrbnd_input_width_for_period").attr("max")))) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $html.find(".bllngrbnd_input_width_for_period").attr("min")
                                                + " to " + $html.find(".bllngrbnd_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".bllngrbnd_input_width_for_period").closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                return;
                            	}

							    require(['charts/indicators/highcharts_custom/bllngrbnd'], function ( bllngrbnd ) {
                                bllngrbnd.init();
                                var options = {
                                    period : parseInt($("#bllngrbnd_time_period").val()),
                                    devUp:parseInt($("#bllngr_dev_up").val()),
                                    devDn:parseInt($("#bllngr_dev_dn").val()),
                                    mdlBndStroke : $("#bllngrbnd_mdl_stroke").css("background-color"),
                                    uprBndStroke : $("#bllngrbnd_up_stroke").css('background-color'),
                                    lwrBndStroke : $("#bllngrbnd_lwr_stroke").css('background-color'),
                                    strokeWidth : parseInt($("#bllngrbnd_strokeWidth").val()),
                                    dashStyle : $("#bllngrbnd_dashStyle").val(),
                                    appliedTo: parseInt($("#bllngrbnd_appliedTo").val())
                                }
                                //Add Bollinger for the main series
                                $($(".bllngrbnd").data('refererChartID')).highcharts().series[0].addBLLNGRBND(options);
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

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

		});
	}

	return{
		open : function(containerIDWithHash){
 			if ($(".bllngrbnd").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".bllngrbnd").data('refererChartID', containerIDWithHash).dialog( "open" );
 		}
	};
});