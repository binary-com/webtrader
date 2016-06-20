/**
 * Created by apoorv on 9/06/16.
 */
define(['jquery', 'windows/windows', 'charts/charts', 'highstock', 'color-picker', 'jquery-growl'], function($, windows, charts){
	
	var chartData = [],
			win = null,
			themeConf = {};

	function createThemeObject(id, value, alpha){
		if(!value)
			return;

		var rgba = [];
		rgba[0] = parseInt(value.substring(0,2),16),
		rgba[1] = parseInt(value.substring(2,4),16),
		rgba[2] = parseInt(value.substring(4,6),16),
		rgba[3] = alpha? parseFloat(alpha) : 1;
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
	}

	$('a.theme_custom')
    .off('click')
    .on('click', function(){

    	var ele = $(this);

    	require(['css!themes/custom_theme/custom_theme.css']);

      require(['text!themes/custom_theme/custom_theme.html'], function($html){
      	$html = $($html);

      	$html.find(".color_input_width").each(function(index, value){
      		var id = $(value).attr("id").replace("theme_",""),
      				alpha = $(value).attr("alpha");
      		$(value).colorpicker({
      			part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:	function(event, color) {
                    $(value).css({
                        background: '#' + color.formatted
                    }).val('');
                    createThemeObject(id, color.formatted, alpha);
										updateChart();
                },
                ok: function(event, color) {
                    $(value).css({
                        background: '#' + color.formatted
                    }).val('');
                    createThemeObject(id, color.formatted, alpha);
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
            my: 'center',
            at: 'center',
            of: window,
            destroy: function() {
                win = null;
            },
            buttons: {
              Apply: function() {
              		openConfirmDialog();
              },
              Cancel: function() {
                  $( this ).dialog( 'close' );
                  $( this ).dialog( "destroy" );
                  var themeName = local_storage.get("theme");
                  themeName = themeName && themeName.name;
                  //Reseting charts to previous theme or default.
							    if (themeName) {
							        require(['lib/highstock/themes/' + themeName]);
							    } else{
							    	Highcharts.setOptions({});
							    }
              }
            }
      		});

    		win.dialog('open');
    		generateData();
    		createChart();
      });
  });

  function generateData() {
	    // generate an array of random data
	    var time = (new Date()).getTime(),
	        i;

	    for (i = -999; i <= 0; i += 1) {
	        var open = Math.round(Math.random() * 100),
	            close = open - Math.round(Math.random() * 15),
	            high = open + Math.round(Math.random() * 15),
	            low = close - Math.round(Math.random() * 15);
	        chartData.push([
	            time + i * 1000 * 60,
	            open, high, low, close
	        ]);
	    }
  }

  function createChart(){
  	var chartOptions = {
			chart: {
          spacingLeft: 0,
          marginLeft: 45,  /* disable the auto size labels so the Y axes become aligned */
          //,plotBackgroundImage: 'images/binary-watermark-logo.svg'
      },
      series: [{
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

      credits: {
          href: 'http://www.binary.com',
          text: 'Binary.com',

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

  function openConfirmDialog(){
  	win = windows.createBlankWindow($('<div class="dialog-confirm-new-theme"/>'),
	        {
	            title: 'Apply new theme?',
	            width: 360,
	            height: 240,
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
	                Apply: function() {    
		                  $.growl.notice({message: 'Loading custom theme.'});
		                  local_storage.remove('theme');
		                  local_storage.set('custom_theme',Highcharts.getOptions());
		                  location.reload();
	                },
	                Cancel: function() {
	                    $( this ).dialog( 'close' );
	                    $( this ).dialog( "destroy" );
	                }
	            }
	        });
	    var p = $('<p>In order to properly apply theme, a full refresh of page is required. Are you sure you want to proceed?</p>');
	    p.appendTo(win);
	    win.dialog('open');
  }

});
