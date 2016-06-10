/*
 * Created by apoorv on 9/06/16.
 */
define(['jquery', 'windows/windows', 'text!themes/preview_theme/preview_theme.html', 'highstock'], function($, windows, $html){
	
	function getThemeConfig(themeConf){
		var theme = {};
		if(themeConf["background"]){
			$.extend(theme,{
				chart:{
					backgroundColor: '#' + themeConf["background"]
				}
			});
		}
		if(themeConf["indicator"]){
			$.extend(theme,{
				colors: ['#' + themeConf['indicator']]
			});
		}
		if(themeConf["xAxis"]){
			$.extend(theme,{
				xAxis: {
					lineColor: '#' + themeConf["xAxis"]
				}
			});
		}
		if(themeConf["xAxis-gridline"]){
			$.extend(theme,{
				xAxis: {
					gridLineColor: '#' + themeConf["xAxis-gridline"]
				}
			});
		}
		if(themeConf["yAxis"]){
			$.extend(theme,{
				yAxis: {
					lineColor: '#' + themeConf["yAxis"]
				}
			});
		}
		if(themeConf["yAxis-gridline"]){
			$.extend(theme,{
				yAxis: {
					gridLineColor: '#' + themeConf["yAxis-gridline"]
				}
			});
		}
		if(themeConf["tooltip"]){
			$.extend(theme,{
				backgroundColor: '#' + themeConf["tooltip"]
			});
		}
		if(themeConf["tooltip-text"]){
			$.extend(theme,{
				style: {
					color: '#' + themeConf["tooltip-text"]
				}
			});
		}

		return theme;
	}

	return{
		open: function(){
			var themeConf = local_storage.get('custom_theme_preview');
			local_storage.remove('custom_theme_preview');
			var theme = getThemeConfig(themeConf);
			Highcharts.setOptions(theme);
			var win = windows.createBlankWindow($html,{
				title:"Preview", 
				width:360,
				height:500,
				buttons: {
		            Apply: function() {
		                $.growl.notice({message: 'Loading preview.'});
		                local_storage.set('custom_theme',themeConf);
		                location.reload();
		            },
		            Cancel: function() {
		                $( this ).dialog( 'close' );
		                $( this ).dialog( "destroy" );
		            }
		        }
			});
			win.dialog("open");
			$("#preview-chart").highcharts('StockChart',{
		        exporting: {
		            enabled: false
		        },
		        series: [{
		            name: 'Some Stock Price',
		            data: (function() {
		                // generate an array of random data
		                var data = [],
		                    time = (new Date()).getTime(),
		                    i;

		                for (i = -999; i <= 0; i += 1) {
		                    var value = Math.round(Math.random() * 100);
		                    data.push([
		                        time + i * 1000 * 60, value
		                    ]);
		                }
		                return data;
		            }()),
		        }]
			});
		},
	};
});
