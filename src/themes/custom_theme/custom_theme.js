/**
 * Created by apoorv on 9/06/16.
 */
define(['jquery', 'windows/windows', 'charts/charts', 'highstock', 'color-picker', 'jquery-growl'], function($, windows, charts){
	
	var chartData = [[1452412800, 32.87, 33.75, 32.5 , 33.28],[1452427200, 33.27, 34.45, 32.81, 34.22], 
			[1452441600, 34.23, 34.73, 33.72, 33.77], [1452456000, 34.23, 34.48, 33.73, 33.84],[1452470400, 33.84, 34.42, 33.2, 33.33],
			[1452484800, 33.34, 33.73, 32.8, 33.55],[1452499200, 32.7, 33.22, 32.56, 32.91],[1452513600, 32.89, 33.38, 32.05, 32.17],
      [1452528000, 32.16, 32.2, 31.21, 31.54],[1452542400, 30.8, 31.87, 30.76, 31.65],[1452556800, 31.66, 32.37, 30.88, 31.09],
      [1452571200, 31.1, 31.27, 30.38, 30.84],[1452585600, 31.52, 31.84, 31.23, 31.48]],
			prevTheme = $.extend(true, {}, Highcharts.getOptions(), {}),
      win = null,
			themeConf = {};

  function hexToRgb(value, alpha){
    var rgba = [];
    rgba[0] = parseInt(value.substring(0,2),16),
    rgba[1] = parseInt(value.substring(2,4),16),
    rgba[2] = parseInt(value.substring(4,6),16),
    rgba[3] = alpha? parseFloat(alpha) : 1;

    return "rgba(" + rgba.join(", ") + ")";
  }

	function createThemeObject(id, color){
		if(!color)
			return;
    color = color.substring(0, color.indexOf(')') + 1); //Fixing mozilla bug
		var temp = "",
				end = "";
		var propertyNames = id.split("_");
		propertyNames.forEach(function(property, index, arr){
			end = end + "}";
			if(index === arr.length - 1){
				temp = temp + "{" + "\"" + property + "\"" + ":" + "\"" + color + "\"";
				return;
			}
			temp = temp + "{" + "\"" + property + "\"" + ":";
		});
		temp = temp + end;
		$.extend(themeConf, JSON.parse(temp));
	}

	function init(confimationDialog){

    	var ele = $(this);

    	require(['css!themes/custom_theme/custom_theme.css']);
      require(['text!themes/custom_theme/custom_theme.html'], function($html){
      	$html = $($html);
      	$html.find(".color_input_width").each(function(index, ele){
      		var id = $(ele).attr("id").replace("theme_",""),
      				alpha = $(ele).attr("alpha"),
              val = getCurrentValue(id);

          if(val){
            $(ele).css({background: val});
          } else{
            var color = $(ele).css("background");
            createThemeObject(id, color);
            Highcharts.setOptions(themeConf);
          }

      		$(ele).colorpicker({
      			part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:	function(event, color) {
                    $(ele).css({
                        background: '#' + color.formatted
                    }).val('');
                    createThemeObject(id, hexToRgb(color.formatted, alpha));
										updateChart();
                },
                ok: function(event, color) {
                    $(ele).css({
                        background: '#' + color.formatted
                    }).val('');
                    createThemeObject(id, hexToRgb(color.formatted, alpha));
                    updateChart();
                },
                cancel: function(event){
                  createThemeObject(id, $(ele).css("background"));
                  updateChart();
                }
      		});
      	});

      	win = windows.createBlankWindow($html,
      		{
      			autoOpen: false,
            resizable: false,
            collapsable: false,
            minimizable: false,
            maximizable: false,
            closable: false,
            closeOnEscape: false,
            width: 650,
            height: 515,
            title: "Customize chart appearance",
            modal: true,
            destroy: function() {
                win = null;
            },
            buttons: {
              Apply: function() {
              		if(typeof confimationDialog === "function")
              			confimationDialog(Highcharts.getOptions());
              },
              Cancel: function() {
                  $( this ).dialog( 'close' );
                  $( this ).dialog( "destroy" );
                  resetTheme();
              }
            }
      		});

    		win.dialog('open');
    		createChart();
      });
  }

  function getCurrentValue(id){
    var value = prevTheme;
    id.split("_").forEach(function(obj, index){
      if(value)
        value = value[obj];
    });
    return value;
  }

  function resetTheme(){
    var defaultOptions = Highcharts.getOptions();
    for (var prop in defaultOptions) {
        if (typeof defaultOptions[prop] !== 'function') delete defaultOptions[prop];
    }
    Highcharts.setOptions(prevTheme);
  }

  function createChart(){
  	var chartOptions = {
			chart: {
          spacingLeft: 0,
          marginLeft: 45,  /* disable the auto size labels so the Y axes become aligned */
          //,plotBackgroundImage: 'images/binary-watermark-logo.svg'
      },
      series: [{
      		type: "candlestick",
          data: chartData
      }],
      navigator: {
          enabled: true,
          series: {
              id: 'navigator'
          }
      },

      //This will be updated when 'Settings' button is implemented
      plotOptions: {
          candlestick: {
              lineColor: 'black',
              color: 'red',
              upColor: 'green',
              upLineColor: 'black',
              shadow: true
          }
      },

      title: {
          //Show name on chart if it is accessed with affiliates = true parameter. In normal webtrader mode, we dont need this title because the dialog will have one
          text: "Some random index"
      },

      xAxis: {
          ordinal : false
      },

      yAxis: [{
          opposite: false,
      }],

      rangeSelector: {
          enabled: false
      },

      tooltip: {
          crosshairs: [{
              width: 2,
              color: 'red',
              dashStyle: 'dash'
          }, {
              width: 2,
              color: 'red',
              dashStyle: 'dash'
          }],
          enabled: true,
          enabledIndicators: true
      }
  	};
  	$("#preview-chart").highcharts('StockChart',chartOptions);
  }

  function updateChart(){
  	Highcharts.setOptions(themeConf);
  	$("#preview-chart").highcharts().destroy();
  	createChart();
  }

  return{
  	init: init
  }
});
