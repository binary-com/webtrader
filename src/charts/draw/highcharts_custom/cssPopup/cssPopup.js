/**
 * Created by apoorv on 10/06/16
 */

define(["jquery", "windows/windows", "color-picker"], function($, windows){

	function createWindow(options, callback){
		require(["text!charts/draw/highcharts_custom/cssPopup/cssPopup.css"]);
		require(["text!charts/draw/highcharts_custom/cssPopup/cssPopup.html"], function($html){
			$html = $($html);
			var table = $html.find("table");
			options.inputValues.forEach(function(input){
				var ele, inputElement;
				if(input.type==="colorpicker"){
					inputElement = $("<input type='button' value='" + input.default + "' class='csspopup_input_width'" + 
						"id='" + input.id + "' style = 'background:"+ input.default + "; color:" + input.default + "' />");
					inputElement.colorpicker({
						part:{
							map: {size:128},
							bar: {size:128}
						},
						select: function(event, color) {
							var c = "#" + color.formatted;
		                    $(inputElement).css({
		                        background: c,
		                        color:c
		                    }).val(c);
		                },
		                ok: function(event, color) {
		                    var c = "#" + color.formatted;
		                    $(inputElement).css({
		                        background: c,
		                        color:c
		                    }).val(c);
		                }
					});
				} else{
					inputElement = $("<input type='" + input.type + "' value='" + input.default + "' class='csspopup_input_width'" + 
						" id='" + input.id + "' name='" + input.name + "'/>");
				}
				if(input.min && input.max){
					inputElement.attr("min", input.min);
					inputElement.attr("max", input.max);
				}
				ele = $("<tr><td><strong>" + input.name + "</strong></td><td></td></tr>");
				inputElement.appendTo(ele.find('td')[1]);
				$(ele).appendTo(table);
			});
			win = windows.createBlankWindow($html,
                {
                    title: options.title,
                    width: 200,
                    height: 200,
                    resizable: false,
                    collapsable: false,
                    minimizable: false,
                    maximizable: false,
                    closable: false,
                    closeOnEscape: false,
                    modal: true,
                    ignoreTileAction:true,
                    'data-authorized': 'true',
                    destroy: function() {
                        win = null;
                    },
                    buttons: {
                        Ok: function() {
                        	var css = {},
                        		error = false;
                            $html.find('input').each(function(index,ele){
                            	var id = $(ele).attr('id'),
                            		value = $(ele).val();
                            	if($(ele).attr('type') === 'number'){
                            		var max = parseInt($(ele).attr('max')),
                            			min = parseInt($(ele).attr('min')),
                            			name = $(ele).attr('name');
                            		value = parseInt(value);
                            		if(value > max || value < min){
                            			$.growl.error({message: "Please enter a value for \"" + name + "\" between "+
                            				min + " and " + max + "."});
                            			error = true;
                            		}
                            	}
                            	css[id] = value;
                            });
                            if(!error){
                            	$( this ).dialog( 'close' );
	                            $( this ).dialog( "destroy" );
	                            callback(css);
                            }
                        },
                        Cancel: function() {
                            $( this ).dialog( 'close' );
                            $( this ).dialog( "destroy" );
                            return {};
                        }
                    }
                });
            win.dialog('open');
		});
	}

	return{
		open: createWindow
	}
});
