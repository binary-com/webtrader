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
		require(['text!charts/indicators/bllngrbnd/bllngrbnd.html'],function($html){
			
			$html=$($html);

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
							    require(['charts/indicators/highcharts_custom/bllngrbnd'], function ( wma ) {
                                wma.init();
                                var options = {
                                    period : parseInt($html.find(".wma_input_width_for_period").val()),
                                    //stroke : defaultStrokeColor,
                                    //strokeWidth : parseInt($html.find("#wma_strokeWidth").val()),
                                    //dashStyle : $html.find("#wma_dashStyle").val(),
                                    appliedTo: parseInt($html.find("#wma_appliedTo").val())
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