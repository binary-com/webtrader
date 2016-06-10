/**
 * Created by apoorv on 9/06/16.
 */
define(['jquery', 'windows/windows', 'themes/preview_theme/preview_theme', 'highstock', 'color-picker', 'jquery-growl'], function($, windows, preview){
	
	var win = null,
		themeConf = {};

	function createThemeObject(id, value){
		var rgba = [];
		console.log(value.substring(0,2));
		rgba[0] = parseInt(value.substring(0,2),16),
		rgba[1] = parseInt(value.substring(2,4),16),
		rgba[2] = parseInt(value.substring(4,6),16),
		rgba[3] = 1;
		console.log(rgba);
		var temp = "",
				end = "";
		var propertyNames = id.split("_");
		propertyNames.forEach(function(property, index, arr){
			// For creating array.
			if(property === "arr"){
				temp = temp + "[" + "\"rgba(" + rgba.join(", ") + ")\"" + "]";
				return;
			}
			end = end + "}";
			if(index === arr.length - 1){
				temp = temp + "{" + "\"" + property + "\"" + ":" + "\"rgba(" + rgba.join(", ") + ")\"";
				return;
			}
			temp = temp + "{" + "\"" + property + "\"" + ":";
		});
		temp = temp + end;
		$.extend(themeConf, JSON.parse(temp));
		console.log(themeConf);
	}

	$('a.theme_custom')
    .off('click')
    .on('click', function(){

    	var ele = $(this);

    	require(['css!themes/custom_theme/custom_theme.css']);

        require(['text!themes/custom_theme/custom_theme.html'], function($html){
        	$html = $($html);

        	$html.find(".color_input_width").each(function(index, value){
        		var id = $(value).attr("id").replace("theme_","");
        		$(value).colorpicker({
        			part:	{
	                    map:		{ size: 128 },
	                    bar:		{ size: 128 }
	                },
	                select:	function(event, color) {
	                    $(value).css({
	                        background: '#' + color.formatted
	                    }).val('');
	                    console.log(color);
	                    createThemeObject(id, color.formatted);
	                },
	                ok: function(event, color) {
	                    $(value).css({
	                        background: '#' + color.formatted
	                    }).val('');
	                    createThemeObject(id, color.formatted);
	                }
        		});
        	});

        	if(!win){
        		win = windows.createBlankWindow($html,
	        		{
	        			autoOpen: false,
		                resizable: false,
		                collapsable: false,
                        minimizable: false,
                        maximizable: false,
                        closable: false,
                        closeOnEscape: false,
		                width: 350,
		                height:400,
		                title: "Customize chart appearance",
		                modal: true,
		                my: 'center',
		                at: 'center',
		                of: window,
	                    destroy: function() {
	                        win = null;
	                    },
	                    buttons: {
		                    Preview: function() {
		                        $.growl.notice({message: 'Loading preview.'});
		                        local_storage.set('custom_theme_preview',themeConf);
		                        preview.open();
		                    },
		                    Cancel: function() {
		                        $( this ).dialog( 'close' );
		                        $( this ).dialog( "destroy" );
		                    }
		                }
	        		});
        		win.dialog('open');
        	} else{
        		console.log("Hmm...weird");
        	}
        });
    });

});
