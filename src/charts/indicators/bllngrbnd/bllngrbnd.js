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
		require(['text!charts/indicators/bllngrbnd/bllngrbnd.html'], function ( $html ) {	
			
			$html = $($html);

			$html.appendTo("body");

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
                                    period : parseInt($html.find(".bllngrbnd_input_width_for_period").val()),
                                    //stroke : defaultStrokeColor,
                                    //strokeWidth : parseInt($html.find("#bllngrbnd_strokeWidth").val()),
                                    //dashStyle : $html.find("#bllngrbnd_dashStyle").val(),
                                    appliedTo: parseInt($html.find("#bllngrbnd_appliedTo").val())
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